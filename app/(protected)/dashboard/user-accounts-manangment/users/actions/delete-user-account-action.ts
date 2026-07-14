"use server";

import z from "zod";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { DeleteUserAccountState } from "@/lib/types";

const DeleteUserAccountSchema = z.object({
  id: z.string().min(1, "ID inválido"),
});

export async function deleteUserAccountAction(
  _prevState: DeleteUserAccountState,
  formData: FormData,
): Promise<DeleteUserAccountState> {
  const fields = {
    id: (formData.get("id") as string) || "",
  };

  const validatedFields = DeleteUserAccountSchema.safeParse(fields);

  if (!validatedFields.success) {
    return {
      success: false,
      dbErrors: { message: "ID inválido" },
    };
  }

  const { id } = validatedFields.data;

  try {
    await prisma.accountRequest.delete({
      where: { id },
    });

    revalidatePath("/dashboard/user-accounts-manangment/users");
    return { success: true, dbErrors: null };
  } catch (error) {
    if (error instanceof Error) {
      return {
        success: false,
        dbErrors: { name: error.name, message: error.message },
      };
    }

    return {
      success: false,
      dbErrors: { message: "Error inesperado" },
    };
  }
}
