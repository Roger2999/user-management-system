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
  };
  const validatedFields = UpdateUserSchema.safeParse(fields);
  if (!validatedFields.success) {
    return {
      data: { username: fields.username },
      success: false,
      dbErrors: null,
      validationErrors: z.flattenError(validatedFields.error).fieldErrors,
    };
  }
  const { username } = validatedFields.data;
  try {
    await auth.api.updateUser({
      body: { name: username },
      headers: await headers(),
    });
    revalidatePath("/dashboard");
    return {
      success: true,
      data: { username: fields.username },
      dbErrors: null,
      validationErrors: null,
      message: "Usuario actualizado con exito",
    };
  } catch (error) {
    if (error instanceof APIError) {
      return {
        data: { username },
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
      data: { username },
      success: false,
      dbErrors: { message: "Unexpected error" },
      validationErrors: null,
    };
  }
};
