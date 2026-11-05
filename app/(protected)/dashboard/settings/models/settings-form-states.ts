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

export type CreateSystemUserState = {
  data?: {
    fullName: string;
    username: string;
    email: string;
    position: string;
    role: string;
  };
  message?: string;
  success?: boolean;
  dbErrors?: DbError;
  validationErrors?: {
    fullName?: string[];
    username?: string[];
    email?: string[];
    position?: string[];
    role?: string[];
    password?: string[];
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

export type ResetUserPasswordState = {
  data?: { userId: string };
  message?: string;
  success?: boolean;
  dbErrors?: DbError;
  validationErrors?: {
    userId?: string[];
    newPassword?: string[];
    confirmNewPassword?: string[];
  } | null;
};

export type SyncAdDirectoryState = {
  status: "idle" | "success" | "error";
  /** Mensaje listo para la pantalla: resumen de la corrida o el motivo real del fallo. */
  message?: string;
};
