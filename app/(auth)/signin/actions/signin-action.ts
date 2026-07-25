"use server";

import { SigninFormState } from "@/lib/types";
import { SigninFormSchema } from "../models/signinSchema.model";
import z from "zod";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export const signinAction = async (
  prevState: SigninFormState,
  formData: FormData,
): Promise<SigninFormState> => {
  const fields = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };
  const validatedFields = SigninFormSchema.safeParse(fields);
  if (!validatedFields.success) {
    return {
      data: { email: fields.email },
      success: false,
      dbErrors: null,
      validationErrors: z.flattenError(validatedFields.error).fieldErrors,
    };
  }
  const { email, password } = validatedFields.data;
  try {
    await auth.api.signInEmail({
      body: { email, password, rememberMe: true },
      headers: await headers(),
    });
  } catch {
    return {
      data: { email },
      success: false,
      dbErrors: { message: "Credenciales incorrectas. Intenta de nuevo." },
      validationErrors: null,
    };
  }
  redirect("/dashboard");
};
