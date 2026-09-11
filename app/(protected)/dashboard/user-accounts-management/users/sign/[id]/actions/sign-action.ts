"use server";

import { SignFormState } from "@/lib/types";
import prisma from "@/lib/prisma";
import { SignFormSchema } from "../models/signSchema.model";
import { revalidatePath } from "next/cache";

const STAGES = [
  { key: "requested", dbKey: "firmadoPorSolicitado", label: "Solicitado" },
  { key: "revised", dbKey: "firmadoPorRevisado", label: "Revisado" },
  { key: "approved", dbKey: "firmadoPorAprobado", label: "Aprobado" },
  { key: "executed", dbKey: "firmadoPorEjecutado", label: "Ejecutado" },
] as const;

export const signAction = async (
  prevState: SignFormState,
  formData: FormData,
): Promise<SignFormState> => {
  const fields = {
    id: formData.get("id") as string,
    requested: formData.get("requested") === "on",
    revised: formData.get("revised") === "on",
    approved: formData.get("approved") === "on",
    executed: formData.get("executed") === "on",
  };
  const validatedFields = SignFormSchema.safeParse(fields);
  if (!validatedFields.success) {
    return {
      data: {
        requested: fields.requested,
        revised: fields.revised,
        approved: fields.approved,
        executed: fields.executed,
      },
      success: false,
      dbErrors: null,
    };
  }
  const { id, ...signs } = validatedFields.data;

  const current = await prisma.accountRequest.findUnique({ where: { id } });
  if (!current) {
    return {
      data: signs,
      success: false,
      dbErrors: { message: "No se encontró la solicitud de cuenta." },
    };
  }

  // Inmutabilidad: una etapa ya firmada no se puede desfirmar.
  for (const stage of STAGES) {
    if (current[stage.dbKey] && !signs[stage.key]) {
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
  for (let i = 1; i < STAGES.length; i++) {
    const stage = STAGES[i];
    const prev = STAGES[i - 1];
    const previousSigned = signs[prev.key] || Boolean(current[prev.dbKey]);
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

  try {
    await prisma.accountRequest.update({
      where: { id },
      data: {
        firmadoPorSolicitado: signs.requested,
        ...(signs.requested && !current.firmadoPorSolicitado
          ? { solicitadoFecha: new Date() }
          : {}),
        firmadoPorRevisado: signs.revised,
        ...(signs.revised && !current.firmadoPorRevisado
          ? { revisadoFecha: new Date() }
          : {}),
        firmadoPorAprobado: signs.approved,
        ...(signs.approved && !current.firmadoPorAprobado
          ? { aprobadoFecha: new Date() }
          : {}),
        firmadoPorEjecutado: signs.executed,
        ...(signs.executed && !current.firmadoPorEjecutado
          ? { ejecutadoFecha: new Date() }
          : {}),
      },
    });
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