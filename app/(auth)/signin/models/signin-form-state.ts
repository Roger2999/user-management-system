import type { DbError } from "@/lib/errors";

export type SigninFormState = {
  data?: { username: string };
  success?: boolean;
  dbErrors?: DbError;
  validationErrors?: {
    username?: string[];
    password?: string[];
  } | null;
};
