"use server";

import z from "zod";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { SignupFormState } from "@/lib/types";
import { SignupFormSchema } from "../models/signupFormSchema.model";
import prisma from "@/lib/prisma";

export const signupAction = async (
  prevState: SignupFormState,
  formData: FormData,
): Promise<SignupFormState> => {
  const fields = {
    username: formData.get("username") as string,
    email: formData.get("email") as string,
    password: formData.get("password") as string,
    confirmPassword: formData.get("confirmPassword") as string,
  };
  const validatedFields = SignupFormSchema.safeParse(fields);
  if (!validatedFields.success) {
    return {
      data: { email: fields.email, username: fields.username },
      success: false,
      dbErrors: null,
      validationErrors: z.flattenError(validatedFields.error).fieldErrors,
    };
  }

  const { email, password, username } = validatedFields.data;

  //validar si ya existe email y username en la db
  const [existingUsername, existingEmail] = await Promise.all([
    prisma.user.findFirst({
      where: { username },
    }),
    prisma.user.findFirst({
      where: { email },
    }),
  ]);

  const validationErrors: SignupFormState["validationErrors"] = {};
  if (existingUsername) {
    validationErrors.username = ["Este nombre de usuario ya existe"];
  }
  if (existingEmail) {
    validationErrors.email = ["Este email ya existe"];
  }
  if (existingUsername || existingEmail) {
    return {
      data: { username, email },
      success: false,
      dbErrors: null,
      validationErrors,
    };
  }

  try {
    await auth.api.signUpEmail({
      body: { email, password, name: username, username, rememberMe: true },
      headers: await headers(),
    });
    // await auth.api.sendVerificationEmail({
    //   body: { email },
    //   headers: await headers(),
    // });
  } catch {
    return {
      data: { email, username },
      success: false,
      dbErrors: { message: "Error al crear la cuenta. Intenta de nuevo." },
      validationErrors: null,
    };
  }
  //redirect(`/verify-email-address?email=${encodeURIComponent(email)}`);
  redirect("/dashboard/");
};
