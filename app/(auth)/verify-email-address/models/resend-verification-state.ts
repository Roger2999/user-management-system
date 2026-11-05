import type { DbError } from "@/lib/errors";

export type ResendVerificationState = {
  data?: { email: string };
  success?: boolean;
  dbErrors?: DbError;
  validationErrors?: {
    email?: string[];
  } | null;
};
