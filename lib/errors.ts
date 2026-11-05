/**
 * Error shape returned by server actions to their forms.
 *
 * This is the only error contract shared between features; every feature owns
 * the form-state types that carry it.
 */
export type DbError = {
  status?: number;
  name?: string;
  message?: string;
  details?: Record<string, string[]>;
} | null;
