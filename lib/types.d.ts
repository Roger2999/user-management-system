import type { AccountRequestValidationErrors } from "../app/(protected)/dashboard/user-accounts-management/users/create/models/account-request-schema.model";

type DbError = {
  status?: number;
  name?: string;
  message?: string;
  details?: Record<string, string[]>;
} | null;

export type SignupFormState = {
  data?: { username?: string; email: string; fullName: string; position: string };
  success?: boolean;
  dbErrors?: DbError;
  validationErrors?: {
    username?: string[];
    fullName?: string[];
    position?: string[];
    email?: string[];
    password?: string[];
    confirmPassword?: string[];
  } | null;
};

export type SigninFormState = {
  data?: { username: string };
  success?: boolean;
  dbErrors?: DbError;
  validationErrors?: {
    username?: string[];
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
  data?: { username: string; displayName?: string; position?: string };
  message?: string;
  success?: boolean;
  dbErrors?: DbError;
  validationErrors?: {
    username?: string[];
    displayName?: string[];
    position?: string[];
  } | null;
};

export type ChangePasswordState = {
  message?: string;
  success?: boolean;
  dbErrors?: DbError;
  validationErrors?: {
    currentPassword?: string[];
    newPassword?: string[];
    confirmNewPassword?: string[];
  } | null;
};

export type CreateUserAccountState = {
  data?: {
    id?: string;
    requestType?: string;
    folio?: string;
    fullName?: string;
    phoneExtension?: string;
    currentPosition?: string;
    department?: string;
    staffType?: string;
    username?: string;
    nationalEmail?: boolean;
    internationalEmail?: boolean;
    internetEmail?: boolean;
    intranetUNE?: boolean;
    nationalIntranet?: boolean;
    internet?: boolean;
    corporateMessaging?: boolean;
    facebook?: boolean;
    twitter?: boolean;
    youtube?: boolean;
    whatsapp?: boolean;
    telegram?: boolean;
    instagram?: boolean;
    otherNetworks?: string;
    userAccount?: boolean;
    advancedUserAccount?: boolean;
    localAdmin?: boolean;
    networkAdmin?: boolean;
    cloudAccessRead?: boolean;
    cloudAccessModify?: boolean;
    cloudAccessDelete?: boolean;
    cloudAccessFullControl?: boolean;
    accountType?: string;
    expiresAt?: string;
    overtimeSchedule?: boolean;
    aroundTheClockSchedule?: boolean;
    overtimeFrom?: string;
    overtimeTo?: string;
    saturdayFrom?: string;
    saturdayTo?: string;
    sundayFrom?: string;
    sundayTo?: string;
    apnNationalEmail?: boolean;
    apnInternationalEmail?: boolean;
    apnInternet?: boolean;
    mobilePhone?: string;
    pcName?: string;
    pcAssetTag?: string;
    additionalPcName?: string;
    additionalPcAssetTag?: string;
    authorizedSoftware?: string;
    deprovisioningReasons?: string;
    deprovisionedAt?: string;
  };
  success?: boolean;
  dbErrors?: DbError;
  validationErrors?: AccountRequestValidationErrors | null;
};
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

export type DeleteUserAccountState = {
  success?: boolean;
  dbErrors?: DbError;
};
