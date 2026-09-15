"use server";

import { SignFormState } from "@/lib/types";
import prisma from "@/lib/prisma";
import {
  SignFormSchema,
  SIGN_STAGES,
} from "../models/signSchema.model";
import { revalidatePath } from "next/cache";
import { AccountRequestStage } from "@/generated/prisma/enums";

type StageKey = (typeof SIGN_STAGES)[number]["key"];

type RawSignFields = {
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

function readFields(formData: FormData): RawSignFields {
  return {
    id: formData.get("id") as string,
    requested: formData.get("requested") === "on",
    requestedNombre: (formData.get("requestedNombre") as string) ?? "",
    requestedCargo: (formData.get("requestedCargo") as string) ?? "",
    revised: formData.get("revised") === "on",
    revisedNombre: (formData.get("revisedNombre") as string) ?? "",
    revisedCargo: (formData.get("revisedCargo") as string) ?? "",
    approved: formData.get("approved") === "on",
    approvedNombre: (formData.get("approvedNombre") as string) ?? "",
    approvedCargo: (formData.get("approvedCargo") as string) ?? "",
    executed: formData.get("executed") === "on",
    executedNombre: (formData.get("executedNombre") as string) ?? "",
    executedCargo: (formData.get("executedCargo") as string) ?? "",
  };
}

const stageToEnum: Record<StageKey, AccountRequestStage> = {
  requested: "requested",
  revised: "revised",
  approved: "approved",
  executed: "executed",
};

// Limpia los campos crudos al shape de SignFormState.data.
function toData(f: RawSignFields) {
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
  const fields = readFields(formData);

  // Una etapa ya firmada es inmutable: el cliente la bloquea con inputs
  // disabled, que NO viajan en el formulario. Tomar sus campos de la DB
  // para que la validación los evalúe con los valores reales y no con vacíos.
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
  for (const stage of SIGN_STAGES) {
    const sig = signatureByStage.get(stageToEnum[stage.key]);
    if (sig) {
      fields[`${stage.key}Nombre`] = sig.nombre;
      fields[`${stage.key}Cargo`] = sig.cargo;
    }
  }

  const validatedFields = SignFormSchema.safeParse(fields);
  if (!validatedFields.success) {
    return {
      data: toData(fields),
      success: false,
      dbErrors: null,
      validationErrors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const id = validatedFields.data.id;
  // readFields siempre entrega todos los campos; toData normaliza el output del schema.
  const signs = toData(validatedFields.data as RawSignFields);

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

  // Crear SOLO las firmas nuevas (las ya existentes son inmutables).
  const newSignatures = SIGN_STAGES.filter(
    (stage) =>
      signs[stage.key] && !existingStages.has(stageToEnum[stage.key]),
  ).map((stage) => ({
    accountRequestId: id,
    stage: stageToEnum[stage.key],
    nombre: signs[`${stage.key}Nombre`],
    cargo: signs[`${stage.key}Cargo`],
    fecha: new Date(),
  }));

  try {
    if (newSignatures.length > 0) {
      await prisma.$transaction(
        newSignatures.map((sig) =>
          prisma.accountRequestSignature.create({ data: sig }),
        ),
      );
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