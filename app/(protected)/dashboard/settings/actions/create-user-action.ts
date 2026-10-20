"use server";

import { randomUUID } from "node:crypto";
import z from "zod";
import { hashPassword } from "better-auth/crypto";
import prisma from "@/lib/prisma";
import { CreateSystemUserState } from "@/lib/types";
import { requireAdmin } from "@/helpers/requireAdmin";
import { CreateUserSchema } from "../models/createUserSchema.model";

export async function createUserAction(
  _prevState: CreateSystemUserState,
  formData: FormData,
): Promise<CreateSystemUserState> {
  await requireAdmin();

  const fields = {
    fullName: (formData.get("fullName") as string) ?? "",
    username: (formData.get("username") as string) ?? "",
    email: (formData.get("email") as string) ?? "",
    position: (formData.get("position") as string) ?? "",
    role: (formData.get("role") as string) ?? "",
    password: (formData.get("password") as string) ?? "",
  };

  const validatedFields = CreateUserSchema.safeParse(fields);

  if (!validatedFields.success) {
    return {
      data: fields,
      success: false,
      dbErrors: null,
      validationErrors: z.flattenError(validatedFields.error).fieldErrors,
    };
  }

  const { fullName, username, email, position, role, password } =
    validatedFields.data;

  const [existingUsername, existingEmail] = await Promise.all([
    prisma.user.findFirst({ where: { username } }),
    prisma.user.findFirst({ where: { email } }),
  ]);

  const validationErrors: CreateSystemUserState["validationErrors"] = {};
  if (existingUsername) {
    validationErrors.username = ["Este nombre de usuario ya existe"];
  }
  if (existingEmail) {
    validationErrors.email = ["Este email ya existe"];
  }
  if (existingUsername || existingEmail) {
    return {
      data: fields,
      success: false,
      dbErrors: null,
      validationErrors,
    };
  }

  try {
    const hashedPassword = await hashPassword(password);

    await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          id: randomUUID(),
          name: fullName,
          username,
          displayUsername: username,
          email,
          emailVerified: true,
          role,
          fullName,
          position,
        },
      });

      await tx.account.create({
        data: {
          id: randomUUID(),
          accountId: user.id,
          providerId: "credential",
          userId: user.id,
          password: hashedPassword,
        },
      });
    });
  } catch (error) {
    console.error("createUserAction: error al crear el usuario", error);
    return {
      data: fields,
      success: false,
      dbErrors: { message: "Error al crear el usuario. Intenta de nuevo." },
      validationErrors: null,
    };
  }

  return {
    data: { fullName, username, email, position, role },
    success: true,
    message: `Usuario «${username}» creado con éxito`,
    dbErrors: null,
    validationErrors: null,
  };
}
