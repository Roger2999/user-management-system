import type { DbError } from "@/lib/errors";

export type SignoutFormState = {
  success?: boolean;
  dbErrors?: DbError;
};
