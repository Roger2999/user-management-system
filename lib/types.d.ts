export type SignupFormState = {
  data?: {
    username?: string;
    email: string;
  };
  success?: boolean;
  dbErrors?: {
    status?: number;
    name?: string;
    message?: string;
    details?: Record<string, string[]>;
  } | null;
  validationErrors?: {
    username?: string[];
    email?: string[];
    password?: string[];
    confirmPassword?: string[];
  } | null;
};
export type SigninFormState = {
  data?: {
    email: string;
  };
  success?: boolean;
  dbErrors?: {
    status?: number;
    name?: string;
    message?: string;
    details?: Record<string, string[]>;
  } | null;
  validationErrors?: {
    email?: string[];
    password?: string[];
  } | null;
};
export type SignoutState = {
  success?: boolean;
  error?: {
    status?: number;
    name?: string;
    message?: string | undefined;
    details?: Record<string, string[]>;
  } | null;
};
