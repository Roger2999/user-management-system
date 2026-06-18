"use server";

import { ResetPasswordState } from "@/lib/types";
import z from "zod";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { APIError } from "better-auth";
import { ResetPasswordSchema } from "../models/reset-password.model";

export const resetPasswordAction = async (
  prevState: ResetPasswordState,
  formData: FormData,
): Promise<ResetPasswordState> => {
  const fields = {
    currentPassword: formData.get("currentPassword") as string,
    newPassword: formData.get("newPassword") as string,
    confirmNewPassword: formData.get("confirmNewPassword") as string,
    token: formData.get("token") as string,
  };
  const validatedFields = ResetPasswordSchema.safeParse(fields);
  if (!validatedFields.success) {
    return {
      success: false,
      dbErrors: null,
      validationErrors: z.flattenError(validatedFields.error).fieldErrors,
    };
  }
  const { newPassword } = validatedFields.data;
  try {
    await auth.api.resetPassword({
      body: { newPassword, token: fields.token },
      headers: await headers(),
    });
  } catch (error) {
    if (error instanceof APIError) {
      return {
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
      success: false,
      dbErrors: { message: "Unexpected error" },
      validationErrors: null,
    };
  }
  redirect("/signin");
};
