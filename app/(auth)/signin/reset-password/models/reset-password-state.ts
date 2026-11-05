import type { DbError } from "@/lib/errors";

export type ResetPasswordState = {
  success?: boolean;
  dbErrors?: DbError;
  validationErrors?: {
    currentPassword?: string[];
    newPassword?: string[];
    confirmNewPassword?: string[];
  } | null;
};
