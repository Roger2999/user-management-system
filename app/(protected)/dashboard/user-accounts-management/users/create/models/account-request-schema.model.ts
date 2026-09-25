import { z } from "zod";

export const AccountRequestSchema = z
  .object({
    // Encabezado
    tipoSolicitud: z.enum(["ALTA", "ACTUALIZACION", "BAJA"], {
      message: "Requerido",
    }),
    folio: z
      .string()
      .min(1, "Requerido")
      .regex(/^[A-Z]+-[A-Z]+-\d+$/, "Formato inválido. Ejemplo: EE-CAR-016")
      .max(100, "Máximo 100 caracteres"),

    // Datos personales
    nombreApellidos: z
      .string()
      .min(1, "Requerido")
      .max(100, "Máximo 100 caracteres"),
    telefonoExtension: z.string().max(50, "Máximo 50 caracteres").optional(),
    cargoOcupa: z
      .string()
      .min(1, "Requerido")
      .max(100, "Máximo 100 caracteres"),
    departamentoArea: z
      .string()
      .min(1, "Requerido")
      .max(100, "Máximo 100 caracteres"),
    tipoPersonal: z.enum(
      ["DIRECTIVO", "ESPECIALISTA_PRINCIPAL", "TECNICO", "OTRO"],
      { message: "Requerido" },
    ),
    identificadorCuentaUsuario: z
      .string()
      .min(1, "Requerido")
      .max(50, "Máximo 50 caracteres"),

    // Correo
    correoNacional: z.boolean().default(false),
    correoInternacional: z.boolean().default(false),
    correoInternet: z.boolean().default(false),

    // Navegación
    intranetUNE: z.boolean().default(false),
    intranetNacional: z.boolean().default(false),
    internet: z.boolean().default(false),

    // Mensajería
    mensajeriaCorporativa: z.boolean().default(false),

    // Redes sociales
    facebook: z.boolean().default(false),
    twitter: z.boolean().default(false),
    youtube: z.boolean().default(false),
    whatsapp: z.boolean().default(false),
    telegram: z.boolean().default(false),
    instagram: z.boolean().default(false),
    otrasRedes: z.string().max(500, "Máximo 500 caracteres").optional(),

    // Privilegios
    usuario: z.boolean().default(false),
    usuarioAvanzado: z.boolean().default(false),
    adminLocal: z.boolean().default(false),
    adminRed: z.boolean().default(false),

    // Acceso Nube UNE
    accesoNubeLectura: z.boolean().default(false),
    accesoNubeModificar: z.boolean().default(false),
    accesoNubeBorrar: z.boolean().default(false),
    accesoNubeControlTotal: z.boolean().default(false),

    // Tipo cuenta
    tipoCuenta: z.enum(["PERMANENTE", "TEMPORAL"], { message: "Requerido" }),
    fechaExpiracion: z.string().max(50, "Máximo 50 caracteres").optional(),

    // Horarios
    horarioExtralaboral: z.boolean().default(false),
    horario24Horas: z.boolean().default(false),
    extraDesde: z.string().max(50, "Máximo 50 caracteres").optional(),
    extraHasta: z.string().max(50, "Máximo 50 caracteres").optional(),
    sabadoDesde: z.string().max(50, "Máximo 50 caracteres").optional(),
    sabadoHasta: z.string().max(50, "Máximo 50 caracteres").optional(),
    domingoDesde: z.string().max(50, "Máximo 50 caracteres").optional(),
    domingoHasta: z.string().max(50, "Máximo 50 caracteres").optional(),

    // APN
    apnCorreoNacional: z.boolean().default(false),
    apnCorreoInternacional: z.boolean().default(false),
    apnInternet: z.boolean().default(false),
    telefonoCelular: z.string().max(50, "Máximo 50 caracteres").optional(),

    // PC
    pcNombre: z
      .string()
      .min(1, "Requerido")
      .max(50, "Máximo 50 caracteres"),
    pcInventario: z
      .string()
      .min(1, "Requerido")
      .max(50, "Máximo 50 caracteres"),
    pcAdicionalNombre: z
      .string()
      .max(100, "Máximo 100 caracteres")
      .optional(),
    pcAdicionalInventario: z
      .string()
      .max(100, "Máximo 100 caracteres")
      .optional(),

    // Software
    softwareAutorizado: z.string().max(500, "Máximo 500 caracteres").optional(),

    // Baja
    motivosBaja: z.string().max(500, "Máximo 500 caracteres").optional(),
    fechaBaja: z.string().max(50, "Máximo 50 caracteres").optional(),
  })
  .superRefine((data, ctx) => {
    if (data.tipoCuenta === "TEMPORAL" && !data.fechaExpiracion) {
      ctx.addIssue({
        code: "custom",
        message: "Requerido para cuentas temporales",
        path: ["fechaExpiracion"],
      });
    }

    if (data.horarioExtralaboral) {
      if (!data.extraDesde) {
        ctx.addIssue({
          code: "custom",
          message: "Requerido cuando horario extralaboral está activo",
          path: ["extraDesde"],
        });
      }
      if (!data.extraHasta) {
        ctx.addIssue({
          code: "custom",
          message: "Requerido cuando horario extrlaboral está activo",
          path: ["extraHasta"],
        });
      }
    }

    if (data.tipoSolicitud === "BAJA") {
      if (!data.motivosBaja) {
        ctx.addIssue({
          code: "custom",
          message: "Requerido para solicitudes de baja",
          path: ["motivosBaja"],
        });
      }
      if (!data.fechaBaja) {
        ctx.addIssue({
          code: "custom",
          message: "Requerido para solicitudes de baja",
          path: ["fechaBaja"],
        });
      }
    }

    const timeRanges = [
      { desde: data.extraDesde, hasta: data.extraHasta, field: "extraHasta" },
      {
        desde: data.sabadoDesde,
        hasta: data.sabadoHasta,
        field: "sabadoHasta",
      },
      {
        desde: data.domingoDesde,
        hasta: data.domingoHasta,
        field: "domingoHasta",
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
