"use server";

import z from "zod";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { APIError } from "better-auth";
import { RequestPasswordResetState } from "@/lib/types";
import { ForgotPasswordSchema } from "../models/forgot-password.model";

export const requestPasswordResetAction = async (
  prevState: RequestPasswordResetState,
  formData: FormData,
): Promise<RequestPasswordResetState> => {
  const fields = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };
  const validatedFields = ForgotPasswordSchema.safeParse(fields);
  if (!validatedFields.success) {
    return {
      data: { email: fields.email },
      success: false,
      dbErrors: null,
      validationErrors: z.flattenError(validatedFields.error).fieldErrors,
    };
  }
  const { email } = validatedFields.data;
  try {
    await auth.api.requestPasswordReset({
      body: { email, redirectTo: "/signin/reset-password" },
      headers: await headers(),
    });
    return {
      data: { email },
      success: true,
      message:
        "Se ha enviado a su email el enlace para restablecer la contraseña",
      dbErrors: null,
      validationErrors: null,
    };
  } catch (error) {
    if (error instanceof APIError) {
      return {
        data: { email },
        success: false,
        dbErrors: {
          name: error.name,
          message: error.message,
          status: error.statusCode,
        },
        validationErrors: null,
      };
    }
    return {
      data: { email },
      success: false,
      dbErrors: { message: "Unexpected error" },
      validationErrors: null,
    };
  }
};
