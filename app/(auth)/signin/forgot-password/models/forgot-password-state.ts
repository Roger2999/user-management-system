import type { DbError } from "@/lib/errors";

export type RequestPasswordResetState = {
  data?: { email: string };
  message?: string;
  success?: boolean;
  dbErrors?: DbError;
  validationErrors?: {
    email?: string[];
  } | null;
};
