"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import type { SessionActionState } from "../models/account-form-states";

/**
 * Cierra todas las sesiones del usuario actual salvo la que está ejecutando la
 * acción. Es la salida rápida cuando sospecha que su cuenta está en otro lado.
 */
export const revokeOtherSessionsAction =
  async (): Promise<SessionActionState> => {
    try {
      await auth.api.revokeOtherSessions({ headers: await headers() });
    } catch (error) {
      console.error(
        "revokeOtherSessionsAction: error al cerrar las sesiones",
        error,
      );
      return {
        success: false,
        message: "No se pudieron cerrar las sesiones. Intenta de nuevo.",
      };
    }

    revalidatePath("/dashboard/settings/account");
    return { success: true, message: "Se cerraron las demás sesiones" };
  };
