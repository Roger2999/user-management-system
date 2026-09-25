"use server";

import { SignFormState } from "@/lib/types";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/helpers/requireAdmin";
import { getSession } from "@/helpers/getSession";
import { SignFormSchema, SIGN_STAGES } from "../models/signSchema.model";
import { revalidatePath } from "next/cache";
import { AccountRequestStage } from "@/generated/prisma/enums";
import type { Prisma } from "@/generated/prisma/client";
import z from "zod";

type StageKey = (typeof SIGN_STAGES)[number]["key"];

// Claves de texto (nombre/cargo) del formulario de firmas.
type CampoTexto =
  | "requestedNombre"
  | "requestedCargo"
  | "revisedNombre"
  | "revisedCargo"
  | "approvedNombre"
  | "approvedCargo"
  | "executedNombre"
  | "executedCargo";

type SignFields = {
  id: string;
  requested: boolean;
  requestedNombre: string;
  requestedCargo: string;
  revised: boolean;
  revisedNombre: string;
  revisedCargo: string;
  approved: boolean;
  approvedNombre: string;
  approvedCargo: string;
  executed: boolean;
  executedNombre: string;
  executedCargo: string;
};

const stageToEnum: Record<StageKey, AccountRequestStage> = {
  requested: "requested",
  revised: "revised",
  approved: "approved",
  executed: "executed",
};

/** Etapas firmadas por el propio operador (especialista) desde su sesión. */
const ETAPAS_PROPIAS: AccountRequestStage[] = ["revised"];

/** Entrada del historial de correcciones de una firma registrada. */
type CorreccionEntry = {
  campo: "nombre" | "cargo";
  valorAnterior: string;
  valorNuevo: string;
  editadoPorUsuario: string;
  fecha: string;
};

function toData(f: SignFields) {
  return {
    requested: f.requested,
    requestedNombre: f.requestedNombre,
    requestedCargo: f.requestedCargo,
    revised: f.revised,
    revisedNombre: f.revisedNombre,
    revisedCargo: f.revisedCargo,
    approved: f.approved,
    approvedNombre: f.approvedNombre,
    approvedCargo: f.approvedCargo,
    executed: f.executed,
    executedNombre: f.executedNombre,
    executedCargo: f.executedCargo,
  };
}

export const signAction = async (
  prevState: SignFormState,
  formData: FormData,
): Promise<SignFormState> => {
  await requireAdmin();

  // La identidad del operador sale de la sesión para sus etapas propias
  // (Revisado/Ejecutado). requireAdmin ya redirige sin sesión; esto es
  // defensa en profundidad para TypeScript y para corridas anómalas.
  const session = await getSession();
  const sessionUser = session?.user;
  if (!sessionUser) {
    return {
      data: null,
      success: false,
      dbErrors: { message: "Sesión no válida. Vuelve a iniciar sesión." },
    };
  }
  const nombreOperador =
    (sessionUser.name ?? "").trim() || (sessionUser.username ?? "").trim();
  const cargoOperador = (sessionUser.cargo ?? "").trim();

  const fields: SignFields = {
    id: (formData.get("id") as string) ?? "",
    requested: formData.get("requested") === "on",
    requestedNombre: "",
    requestedCargo: "",
    revised: formData.get("revised") === "on",
    revisedNombre: "",
    revisedCargo: "",
    approved: formData.get("approved") === "on",
    approvedNombre: "",
    approvedCargo: "",
    executed: formData.get("executed") === "on",
    executedNombre: "",
    executedCargo: "",
  };

  // Valor textual de un campo, o null si no viajó en el formulario
  // (input deshabilitado / no renderizado) o quedó vacío.
  const valorFormulario = (campo: string): string | null => {
    const v = formData.get(campo);
    return typeof v === "string" && v.trim().length > 0 ? v : null;
  };

  const current = await prisma.accountRequest.findUnique({
    where: { id: fields.id },
    include: { signatures: true },
  });
  if (!current) {
    return {
      data: toData(fields),
      success: false,
      dbErrors: { message: "No se encontró la solicitud de cuenta." },
    };
  }

  const signatureByStage = new Map(
    current.signatures.map((sig) => [sig.stage, sig]),
  );

  // Por etapa: identidad del firmante y valores para la validación.
  for (const stage of SIGN_STAGES) {
    const enumStage = stageToEnum[stage.key];
    const sig = signatureByStage.get(enumStage);
    const esPropia = ETAPAS_PROPIAS.includes(enumStage);
    const nombreKey = `${stage.key}Nombre` as CampoTexto;
    const cargoKey = `${stage.key}Cargo` as CampoTexto;

    if (esPropia) {
      // Etapas del especialista: la identidad viene de la sesión y NUNCA
      // del formulario (el cliente ni siquiera renderiza inputs para ellas).
      fields[nombreKey] = nombreOperador;
      fields[cargoKey] = cargoOperador;
      continue;
    }

    // Etapas externas (Solicitado/Aprobado): texto libre del operador,
    // que registra fielmente lo firmado en papel. Si el input no viajó
    // (deshabilitado por orden) y la etapa ya está firmada, se usan los
    // valores reales de la DB para que la validación no falle.
    const nombreForm = valorFormulario(`${stage.key}Nombre`);
    const cargoForm = valorFormulario(`${stage.key}Cargo`);
    fields[nombreKey] = nombreForm ?? (sig ? sig.nombre : "");
    fields[cargoKey] = cargoForm ?? (sig ? sig.cargo : "");
  }

  const validatedFields = SignFormSchema.safeParse(fields);
  if (!validatedFields.success) {
    return {
      data: toData(fields),
      success: false,
      dbErrors: null,
      validationErrors: z.flattenError(validatedFields.error).fieldErrors,
    };
  }

  const id = validatedFields.data.id;
  const signs = toData(validatedFields.data as SignFields);

  const existingStages = new Set(current.signatures.map((sig) => sig.stage));

  // Inmutabilidad: una etapa ya firmada no se puede desfirmar.
  for (const stage of SIGN_STAGES) {
    if (existingStages.has(stageToEnum[stage.key]) && !signs[stage.key]) {
      return {
        data: signs,
        success: false,
        dbErrors: {
          message: `La firma de «${stage.label}» ya está registrada y no se puede revertir.`,
        },
      };
    }
  }

  // Orden del flujo: para firmar una etapa, la anterior debe estar firmada.
  for (let i = 1; i < SIGN_STAGES.length; i++) {
    const stage = SIGN_STAGES[i];
    const prev = SIGN_STAGES[i - 1];
    const previousSigned =
      signs[prev.key] || existingStages.has(stageToEnum[prev.key]);
    if (signs[stage.key] && !previousSigned) {
      return {
        data: signs,
        success: false,
        dbErrors: {
          message: `Para firmar «${stage.label}» primero debe estar firmado «${prev.label}».`,
        },
      };
    }
  }

  const editadoPorUsuario = sessionUser.username ?? sessionUser.id;

  // Operaciones por etapa: crear firmas nuevas y corregir las existentes.
  const operations: Prisma.PrismaPromise<unknown>[] = [];

  for (const stage of SIGN_STAGES) {
    const enumStage = stageToEnum[stage.key];
    const sig = signatureByStage.get(enumStage);
    const nombreKey = `${stage.key}Nombre` as CampoTexto;
    const cargoKey = `${stage.key}Cargo` as CampoTexto;

    if (!sig) {
      // Sin firma previa: solo se crea si el checkbox está marcado.
      if (signs[stage.key]) {
        operations.push(
          prisma.accountRequestSignature.create({
            data: {
              accountRequestId: id,
              stage: enumStage,
              nombre: signs[nombreKey],
              cargo: signs[cargoKey],
              fecha: new Date(),
              registradoPorUserId: sessionUser.id,
              registradoPorNombre: sessionUser.name,
            },
          }),
        );
      }
      continue;
    }

    // Firma existente (el cliente fuerza el checkbox en "on", por lo que
    // aquí ya se validó la inmutabilidad): si nombre/cargo cambiaron, se
    // corrigen y se anexan las entradas al historial.
    const nombreNuevo = signs[nombreKey];
    const cargoNuevo = signs[cargoKey];
    const correcciones: CorreccionEntry[] = [];
    if (sig.nombre !== nombreNuevo) {
      correcciones.push({
        campo: "nombre",
        valorAnterior: sig.nombre,
        valorNuevo: nombreNuevo,
        editadoPorUsuario,
        fecha: new Date().toISOString(),
      });
    }
    if (sig.cargo !== cargoNuevo) {
      correcciones.push({
        campo: "cargo",
        valorAnterior: sig.cargo,
        valorNuevo: cargoNuevo,
        editadoPorUsuario,
        fecha: new Date().toISOString(),
      });
    }
    if (correcciones.length > 0) {
      const historialPrevio =
        (sig.historialCorrecciones ?? []) as unknown as CorreccionEntry[];
      operations.push(
        prisma.accountRequestSignature.update({
          where: { id: sig.id },
          data: {
            nombre: nombreNuevo,
            cargo: cargoNuevo,
            historialCorrecciones: [...historialPrevio, ...correcciones],
          },
        }),
      );
    }
  }

  try {
    if (operations.length > 0) {
      await prisma.$transaction(operations);
    }
    revalidatePath(`/dashboard/user-accounts-management/users/sign/${id}`);
    return {
      data: signs,
      success: true,
      dbErrors: null,
    };
  } catch (error) {
    console.error("Error updating signs:", error);
    return {
      data: signs,
      success: false,
      dbErrors: { message: "Error al procesar las firmas. Intenta de nuevo." },
    };
  }
};