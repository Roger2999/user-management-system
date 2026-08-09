import type { AccountRequestValidationErrors } from "../app/(protected)/dashboard/user-accounts-management/users/create/models/account-request-schema.model";

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
    telefonoExtension?: string;
    cargoOcupa?: string;
    departamentoArea?: string;
    tipoPersonal?: string;
    identificadorCuentaUsuario?: string;
    correoNacional?: boolean;
    correoInternacional?: boolean;
    correoInternet?: boolean;
    intranetUNE?: boolean;
    intranetNacional?: boolean;
    internet?: boolean;
    mensajeriaCorporativa?: boolean;
    facebook?: boolean;
    twitter?: boolean;
    youtube?: boolean;
    whatsapp?: boolean;
    telegram?: boolean;
    instagram?: boolean;
    otrasRedes?: string;
    usuario?: boolean;
    usuarioAvanzado?: boolean;
    adminLocal?: boolean;
    adminRed?: boolean;
    accesoNubeLectura?: boolean;
    accesoNubeModificar?: boolean;
    accesoNubeBorrar?: boolean;
    accesoNubeControlTotal?: boolean;
    tipoCuenta?: string;
    fechaExpiracion?: string;
    horarioExtralaboral?: boolean;
    horario24Horas?: boolean;
    extraDesde?: string;
    extraHasta?: string;
    sabadoDesde?: string;
    sabadoHasta?: string;
    domingoDesde?: string;
    domingoHasta?: string;
    apnCorreoNacional?: boolean;
    apnCorreoInternacional?: boolean;
    apnInternet?: boolean;
    telefonoCelular?: string;
    pcNombre?: string;
    pcInventario?: string;
    pcAdicionalNombre?: string;
    pcAdicionalInventario?: string;
    softwareAutorizado?: string;
    // cuentaUsuario?: string;
    // actividadRealiza?: string;
    // administradorSistema?: boolean;
    motivosBaja?: string;
    fechaBaja?: string;
  };
  success?: boolean;
  dbErrors?: DbError;
  validationErrors?: AccountRequestValidationErrors | null;
};
export type SignFormState = {
  data?: {
    requested?: boolean;
    revised?: boolean;
    approved?: boolean;
    executed?: boolean;
  } | null;
  success?: boolean;
  dbErrors?: DbError;
};

export type DeleteUserAccountState = {
  success?: boolean;
  dbErrors?: DbError;
};
