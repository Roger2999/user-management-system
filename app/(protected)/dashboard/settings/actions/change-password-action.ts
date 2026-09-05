"use server";

import z from "zod";
import { APIError } from "better-auth";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { ChangePasswordState } from "@/lib/types";
import { ChangePasswordSchema } from "../models/changePasswordSchema.model";

export const changePasswordAction = async (
  prevState: ChangePasswordState,
  formData: FormData,
): Promise<ChangePasswordState> => {
  const fields = {
    currentPassword: formData.get("currentPassword") as string,
    newPassword: formData.get("newPassword") as string,
    confirmNewPassword: formData.get("confirmNewPassword") as string,
  };
  const validatedFields = ChangePasswordSchema.safeParse(fields);
  if (!validatedFields.success) {
    return {
      success: false,
      dbErrors: null,
      validationErrors: z.flattenError(validatedFields.error).fieldErrors,
    };
  }
  const { currentPassword, newPassword } = validatedFields.data;
  try {
    await auth.api.changePassword({
      body: { currentPassword, newPassword },
      headers: await headers(),
    });
    revalidatePath("/dashboard/settings");
    return {
      success: true,
      message: "Contraseña actualizada con éxito",
      dbErrors: null,
      validationErrors: null,
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
        validationErrors: null,
      };
    }
    return {
      success: false,
      dbErrors: { message: "Error inesperado" },
      validationErrors: null,
    };
  }
};