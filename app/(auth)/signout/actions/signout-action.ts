"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { APIError } from "better-auth";
import { SignoutFormState } from "@/lib/types";

export const signoutAction = async (
  prevState: SignoutFormState,
): Promise<SignoutFormState> => {
  try {
    await auth.api.signOut({
      headers: await headers(),
    });
    return {
      success: true,
      dbErrors: null,
    };
  } catch (error) {
    if (error instanceof APIError) {
      return {
        success: false,
        dbErrors: {
          name: error.name,
          message: error.message,
          status: error.statusCode,
        },
      };
    }
    return {
      success: false,
      dbErrors: { message: "Error inesperado" },
    };
  }
};
