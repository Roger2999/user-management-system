"use server";

import { APIError } from "better-auth";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

export const revokeSessionAction = async (formData: FormData) => {
  const token = (formData.get("token") as string) ?? "";
  if (!token) return;
  try {
    await auth.api.revokeSession({
      body: { token },
      headers: await headers(),
    });
  } catch (error) {
    if (error instanceof APIError) {
      console.error("Error revoking session:", error.message);
    }
  }
  revalidatePath("/dashboard/settings");
};