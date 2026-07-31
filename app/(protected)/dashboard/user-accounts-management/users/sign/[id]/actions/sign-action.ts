"use server";

import { SignFormState } from "@/lib/types";
import prisma from "@/lib/prisma";
import { SignFormSchema } from "../models/signSchema.model";
import { revalidatePath } from "next/cache";

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
  const { id, requested, revised, approved, executed } = validatedFields.data;
  try {
    await prisma.accountRequest.update({
      where: { id },
      data: {
        firmadoPorSolicitado: requested,
        solicitadoFecha: requested ? new Date() : null,
        firmadoPorRevisado: revised,
        revisadoFecha: revised ? new Date() : null,
        firmadoPorAprobado: approved,
        aprobadoFecha: approved ? new Date() : null,
        firmadoPorEjecutado: executed,
        ejecutadoFecha: executed ? new Date() : null,
      },
    });
    revalidatePath(`/dashboard/user-accounts-management/users/sign/${id}`);
    return {
      data: { requested, revised, approved, executed },
      success: true,
      dbErrors: null,
    };
  } catch (error) {
    console.error("Error updating signs:", error);
    return {
      data: { requested, revised, approved, executed },
      success: false,
      dbErrors: { message: "Error al procesar las firmas. Intenta de nuevo." },
    };
  }
};
