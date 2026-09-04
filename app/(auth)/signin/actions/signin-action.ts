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
    username: formData.get("username") as string,
    password: formData.get("password") as string,
  };
  const validatedFields = SigninFormSchema.safeParse(fields);
  if (!validatedFields.success) {
    return {
      data: { username: fields.username },
      success: false,
      dbErrors: null,
      validationErrors: z.flattenError(validatedFields.error).fieldErrors,
    };
  }
  const { username, password } = validatedFields.data;
  try {
    await auth.api.signInUsername({
      body: { username, password, rememberMe: true },
      headers: await headers(),
    });
  } catch {
    return {
      data: { username },
      success: false,
      dbErrors: { message: "Credenciales incorrectas. Intenta de nuevo." },
      validationErrors: null,
    };
  }
  redirect("/dashboard");
};
