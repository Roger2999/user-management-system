import type { DbError } from "@/lib/errors";

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
