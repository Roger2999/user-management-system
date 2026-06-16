"use server";

import { ResendVerificationState } from "@/lib/types";
import { ResendVerificationSchema } from "../models/resendVerificationSchema.model";
import z from "zod";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { APIError } from "better-auth";

export const resendVerificationAction = async (
  prevState: ResendVerificationState,
  formData: FormData,
): Promise<ResendVerificationState> => {
  const fields = {
    email: formData.get("email") as string,
  };
  const validatedFields = ResendVerificationSchema.safeParse(fields);
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
    await auth.api.sendVerificationEmail({
      body: { email },
      headers: await headers(),
    });
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
      dbErrors: { message: "Error al reenviar el email" },
      validationErrors: null,
    };
  }
  return {
    data: { email },
    success: true,
    dbErrors: null,
    validationErrors: null,
  };
};
