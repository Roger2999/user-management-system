"use server";

import z from "zod";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { SignupFormState } from "@/lib/types";
import { SignupFormSchema } from "../models/signupFormSchema.model";
import { APIError } from "better-auth";

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
  try {
    await auth.api.signUpEmail({
      body: { email, password, name: username, rememberMe: true },
      headers: await headers(),
    });
    await auth.api.sendVerificationEmail({
      body: { email },
      headers: await headers(),
    });
  } catch (error) {
    if (error instanceof APIError) {
      return {
        data: { email, username },
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
      data: { email, username },
      success: false,
      dbErrors: { message: "Error inesperado" },
      validationErrors: null,
    };
  }
  redirect(`/verify-email-address?email=${encodeURIComponent(email)}`);
};
