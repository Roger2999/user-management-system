import { z } from "zod";

export const AccountRequestSchema = z
  .object({
    // Header
    requestType: z.enum(["NEW", "UPDATE", "DEPROVISIONING"], {
      message: "Requerido",
    }),
    folio: z
      .string()
      .min(1, "Requerido")
      .regex(/^[A-Z]+-[A-Z]+-\d+$/, "Formato inválido. Ejemplo: EE-CAR-016")
      .max(100, "Máximo 100 caracteres"),

    // Personal details
    fullName: z
      .string()
      .min(1, "Requerido")
      .max(100, "Máximo 100 caracteres"),
    phoneExtension: z.string().max(50, "Máximo 50 caracteres").optional(),
    currentPosition: z
      .string()
      .min(1, "Requerido")
      .max(100, "Máximo 100 caracteres"),
    department: z
      .string()
      .min(1, "Requerido")
      .max(100, "Máximo 100 caracteres"),
    staffType: z.enum(
      ["EXECUTIVE", "SENIOR_SPECIALIST", "TECHNICIAN", "OTHER"],
      { message: "Requerido" },
    ),
    username: z
      .string()
      .min(1, "Requerido")
      .max(50, "Máximo 50 caracteres"),

    // Email
    nationalEmail: z.boolean().default(false),
    internationalEmail: z.boolean().default(false),
    internetEmail: z.boolean().default(false),

    // Web browsing
    intranetUNE: z.boolean().default(false),
    nationalIntranet: z.boolean().default(false),
    internet: z.boolean().default(false),

    // Messaging
    corporateMessaging: z.boolean().default(false),

    // Social media
    facebook: z.boolean().default(false),
    twitter: z.boolean().default(false),
    youtube: z.boolean().default(false),
    whatsapp: z.boolean().default(false),
    telegram: z.boolean().default(false),
    instagram: z.boolean().default(false),
    otherNetworks: z.string().max(500, "Máximo 500 caracteres").optional(),

    // Privileges
    userAccount: z.boolean().default(false),
    advancedUserAccount: z.boolean().default(false),
    localAdmin: z.boolean().default(false),
    networkAdmin: z.boolean().default(false),

    // UNE cloud access
    cloudAccessRead: z.boolean().default(false),
    cloudAccessModify: z.boolean().default(false),
    cloudAccessDelete: z.boolean().default(false),
    cloudAccessFullControl: z.boolean().default(false),

    // Account type
    accountType: z.enum(["PERMANENT", "TEMPORARY"], { message: "Requerido" }),
    expiresAt: z.string().max(50, "Máximo 50 caracteres").optional(),

    // Schedules
    overtimeSchedule: z.boolean().default(false),
    aroundTheClockSchedule: z.boolean().default(false),
    overtimeFrom: z.string().max(50, "Máximo 50 caracteres").optional(),
    overtimeTo: z.string().max(50, "Máximo 50 caracteres").optional(),
    saturdayFrom: z.string().max(50, "Máximo 50 caracteres").optional(),
    saturdayTo: z.string().max(50, "Máximo 50 caracteres").optional(),
    sundayFrom: z.string().max(50, "Máximo 50 caracteres").optional(),
    sundayTo: z.string().max(50, "Máximo 50 caracteres").optional(),

    // APN
    apnNationalEmail: z.boolean().default(false),
    apnInternationalEmail: z.boolean().default(false),
    apnInternet: z.boolean().default(false),
    mobilePhone: z.string().max(50, "Máximo 50 caracteres").optional(),

    // PC
    pcName: z
      .string()
      .min(1, "Requerido")
      .max(50, "Máximo 50 caracteres"),
    pcAssetTag: z
      .string()
      .min(1, "Requerido")
      .max(50, "Máximo 50 caracteres"),
    additionalPcName: z
      .string()
      .max(100, "Máximo 100 caracteres")
      .optional(),
    additionalPcAssetTag: z
      .string()
      .max(100, "Máximo 100 caracteres")
      .optional(),

    // Software
    authorizedSoftware: z.string().max(500, "Máximo 500 caracteres").optional(),

    // Deprovisioning
    deprovisioningReasons: z.string().max(500, "Máximo 500 caracteres").optional(),
    deprovisionedAt: z.string().max(50, "Máximo 50 caracteres").optional(),
  })
  .superRefine((data, ctx) => {
    if (data.accountType === "TEMPORARY" && !data.expiresAt) {
      ctx.addIssue({
        code: "custom",
        message: "Requerido para cuentas temporales",
        path: ["expiresAt"],
      });
    }

    if (data.overtimeSchedule) {
      if (!data.overtimeFrom) {
        ctx.addIssue({
          code: "custom",
          message: "Requerido cuando horario extralaboral está activo",
          path: ["overtimeFrom"],
        });
      }
      if (!data.overtimeTo) {
        ctx.addIssue({
          code: "custom",
          message: "Requerido cuando horario extrlaboral está activo",
          path: ["overtimeTo"],
        });
      }
    }

    if (data.requestType === "DEPROVISIONING") {
      if (!data.deprovisioningReasons) {
        ctx.addIssue({
          code: "custom",
          message: "Requerido para solicitudes de baja",
          path: ["deprovisioningReasons"],
        });
      }
      if (!data.deprovisionedAt) {
        ctx.addIssue({
          code: "custom",
          message: "Requerido para solicitudes de baja",
          path: ["deprovisionedAt"],
        });
      }
    }

    const timeRanges = [
      { desde: data.overtimeFrom, hasta: data.overtimeTo, field: "overtimeTo" },
      {
        desde: data.saturdayFrom,
        hasta: data.saturdayTo,
        field: "saturdayTo",
      },
      {
        desde: data.sundayFrom,
        hasta: data.sundayTo,
        field: "sundayTo",
      },
    ] as const;
    for (const { desde, hasta, field } of timeRanges) {
      if (desde && hasta && desde >= hasta) {
        ctx.addIssue({
          code: "custom",
          message: "La hora final debe ser posterior a la hora inicial",
          path: [field],
        });
      }
    }
  });

export type SolicitudCuentaFormData = z.infer<typeof AccountRequestSchema>;
export type AccountRequestFieldName = keyof SolicitudCuentaFormData;
export type AccountRequestValidationErrors = Partial<
  Record<AccountRequestFieldName, string[]>
>;
