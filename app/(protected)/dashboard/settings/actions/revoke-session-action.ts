"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import type { SessionActionState } from "@/lib/types";

/**
 * Cierra una sesión concreta del usuario actual. better-auth verifica que el
 * token pertenezca a la sesión autenticada antes de revocarlo.
 */
export const revokeSessionAction = async (
  formData: FormData,
): Promise<SessionActionState> => {
  const token = (formData.get("token") as string) ?? "";
  if (!token) {
    return { success: false, message: "La sesión no es válida" };
  }

  try {
    await auth.api.revokeSession({
      body: { token },
      headers: await headers(),
    });
  } catch (error) {
    console.error("revokeSessionAction: error al cerrar la sesión", error);
    return {
      success: false,
      message: "No se pudo cerrar la sesión. Intenta de nuevo.",
    };
  }

  revalidatePath("/dashboard/settings");
  return { success: true, message: "Sesión cerrada" };
};
