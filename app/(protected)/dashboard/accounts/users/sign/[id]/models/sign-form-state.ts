import type { DbError } from "@/lib/errors";

export type SignFormState = {
  data?: {
    requested?: boolean;
    requestedName?: string;
    requestedPosition?: string;
    revised?: boolean;
    revisedName?: string;
    revisedPosition?: string;
    approved?: boolean;
    approvedName?: string;
    approvedPosition?: string;
    executed?: boolean;
    executedName?: string;
    executedPosition?: string;
  } | null;
  success?: boolean;
  dbErrors?: DbError;
  validationErrors?: Record<string, string[] | undefined>;
};
