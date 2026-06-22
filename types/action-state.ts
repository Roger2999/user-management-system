// types/action-state.ts

/** Error de base de datos / servidor */
export type DbError = {
  status?: number;
  name?: string;
  message?: string;
  details?: Record<string, string[]>;
} | null;

/**
 * Estado genérico para todas las Server Actions.
 *
 * @param TData   - Shape del dato retornado en éxito
 * @param TFields - Union de los campos del formulario para validationErrors
 *
 * @example
 * type SignupState = ActionState
 *   { username: string; email: string },
 *   'username' | 'email' | 'password' | 'confirmPassword'
 * >
 */
export type ActionState
  TData = undefined,
  TFields extends string = never,
> = {
  data?: TData;
  success?: boolean;
  message?: string;
  dbErrors?: DbError;
  validationErrors?: Partial<Record<TFields, string[]>> | null;
};