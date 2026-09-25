"use server";

import z from "zod";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { APIError } from "better-auth";
import { UpdateUserState } from "@/lib/types";
import { UpdateUserSchema } from "../models/updateUserSchema.model";
import { revalidatePath } from "next/cache";

export const UpdateUserAction = async (
  prevState: UpdateUserState,
  formData: FormData,
): Promise<UpdateUserState> => {
  const fields = {
    username: formData.get("username") as string,
    displayName: formData.get("displayName") as string,
    cargo: formData.get("cargo") as string,
  };
  const validatedFields = UpdateUserSchema.safeParse(fields);
  if (!validatedFields.success) {
    return {
      data: {
        username: fields.username,
        displayName: fields.displayName,
        cargo: fields.cargo,
      },
      success: false,
      dbErrors: null,
      validationErrors: z.flattenError(validatedFields.error).fieldErrors,
    };
  }
  const { username, displayName, cargo } = validatedFields.data;
  try {
    await auth.api.updateUser({
      body: {
        username,
        ...(displayName?.trim() ? { displayUsername: displayName.trim() } : {}),
        // Cargo vacío -> null en la DB (el operador puede desconfigurarlo).
        ...(cargo !== undefined ? { cargo: cargo.trim() || null } : {}),
      },
      headers: await headers(),
    });
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/settings");
    return {
      success: true,
      data: { username, displayName, cargo },
      dbErrors: null,
      validationErrors: null,
      message: "Usuario actualizado con éxito",
    };
  } catch (error) {
    if (error instanceof APIError) {
      return {
        data: { username, displayName, cargo },
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
      data: { username, displayName, cargo },
      success: false,
      dbErrors: { message: "Error inesperado" },
      validationErrors: null,
    };
  }
};