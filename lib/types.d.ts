import type { AccountRequestValidationErrors } from "../app/(protected)/dashboard/users/create/models/account-request-schema.model";

type DbError = {
  status?: number;
  name?: string;
  message?: string;
  details?: Record<string, string[]>;
} | null;

export type SignupFormState = {
  data?: { username?: string; email: string };
  success?: boolean;
  dbErrors?: DbError;
  validationErrors?: {
    username?: string[];
    email?: string[];
    password?: string[];
    confirmPassword?: string[];
  } | null;
};

export type SigninFormState = {
  data?: { email: string };
  success?: boolean;
  dbErrors?: DbError;
  validationErrors?: {
    email?: string[];
    password?: string[];
  } | null;
};

export type SignoutFormState = {
  success?: boolean;
  dbErrors?: DbError;
};

export type ResendVerificationState = {
  data?: { email: string };
  success?: boolean;
  dbErrors?: DbError;
  validationErrors?: {
    email?: string[];
  } | null;
};

export type RequestPasswordResetState = {
  data?: { email: string };
  message?: string;
  success?: boolean;
  dbErrors?: DbError;
  validationErrors?: {
    email?: string[];
  } | null;
};

export type ResetPasswordState = {
  success?: boolean;
  dbErrors?: DbError;
  validationErrors?: {
    currentPassword?: string[];
    newPassword?: string[];
    confirmNewPassword?: string[];
  } | null;
};

export type UpdateUserState = {
  data?: { username: string };
  message?: string;
  success?: boolean;
  dbErrors?: DbError;
  validationErrors?: {
    username?: string[];
  } | null;
};

export type CreateUserAccountState = {
  data?: {
    id?: string;
    tipoSolicitud?: string;
    folio?: string;
    nombreApellidos?: string;
    cargoOcupa?: string;
    departamentoArea?: string;
    tipoPersonal?: string;
    cuenta?: string;
    correoInternetFechaTemp?: string;
    internetFechaTemp?: string;
    chatInternetFechaTemp?: string;
    otrasRedes?: string;
    tipoCuenta?: string;
    fechaExpiracion?: string;
    extraDesde?: string;
    extraHasta?: string;
    sabadoDesde?: string;
    sabadoHasta?: string;
    domingoDesde?: string;
    domingoHasta?: string;
    telefonoCelular?: string;
    pcNombre?: string;
    pcInventario?: string;
    pcAdicionalNombre?: string;
    pcAdicionalInventario?: string;
    softwareAutorizado?: string;
    cuentaUsuario?: string;
    actividadRealiza?: string;
    solicitadoNombre?: string;
    solicitadoCargo?: string;
    solicitadoFecha?: string;
    revisadoNombre?: string;
    revisadoCargo?: string;
    revisadoFecha?: string;
    aprobadoNombre?: string;
    aprobadoCargo?: string;
    aprobadoFecha?: string;
    ejecutadoNombre?: string;
    ejecutadoCargo?: string;
    ejecutadoFecha?: string;
    motivosBaja?: string;
    fechaBaja?: string;
  };
  success?: boolean;
  dbErrors?: DbError;
  validationErrors?: AccountRequestValidationErrors | null;
};
