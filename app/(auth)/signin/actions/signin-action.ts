"use server";

import { SigninFormState } from "@/lib/types";
import { SigninFormSchema } from "../models/signinSchema.model";
import z from "zod";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { APIError } from "better-auth";

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
      dbErrors: { message: "Unexpected error" },
      validationErrors: null,
    };
  }
  redirect("/dashboard");
};
