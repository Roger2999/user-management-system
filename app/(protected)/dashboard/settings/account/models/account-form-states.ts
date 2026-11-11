import type { DbError } from "@/lib/errors";

export type UpdateUserState = {
  data?: { username: string; displayName?: string; position?: string };
  message?: string;
  success?: boolean;
  dbErrors?: DbError;
  validationErrors?: {
    username?: string[];
    displayName?: string[];
    position?: string[];
  } | null;
};

export type ChangePasswordState = {
  message?: string;
  success?: boolean;
  dbErrors?: DbError;
  validationErrors?: {
    currentPassword?: string[];
    newPassword?: string[];
    confirmNewPassword?: string[];
  } | null;
};

export type SessionActionState = {
  success?: boolean;
  message?: string;
};
