import { z } from "zod";

export const AccountRequestSchema = z
  .object({
    // Encabezado
    tipoSolicitud: z.enum(["ALTA", "ACTUALIZACION", "BAJA"], {
      message: "Requerido",
    }),
    folio: z.string().min(1, "Requerido"),

    // Datos personales
    nombreApellidos: z.string().min(1, "Requerido"),
    telefonoExtension: z.string().optional(),
    cargoOcupa: z.string().min(1, "Requerido"),
    departamentoArea: z.string().min(1, "Requerido"),
    tipoPersonal: z.enum(
      ["DIRECTIVO", "ESPECIALISTA_PRINCIPAL", "TECNICO", "OTRO"],
      { message: "Requerido" },
    ),
    identificadorCuentaUsuario: z.string().optional(),

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
    otrasRedes: z.string().optional(),

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
    fechaExpiracion: z.string().optional(),

    // Horarios
    horarioExtralaboral: z.boolean().default(false),
    horario24Horas: z.boolean().default(false),
    extraDesde: z.string().optional(),
    extraHasta: z.string().optional(),
    sabadoDesde: z.string().optional(),
    sabadoHasta: z.string().optional(),
    domingoDesde: z.string().optional(),
    domingoHasta: z.string().optional(),

    // APN
    apnCorreoNacional: z.boolean().default(false),
    apnCorreoInternacional: z.boolean().default(false),
    apnInternet: z.boolean().default(false),
    telefonoCelular: z.string().optional(),

    // PC
    pcNombre: z.string().optional(),
    pcInventario: z.string().optional(),
    pcAdicionalNombre: z.string().optional(),
    pcAdicionalInventario: z.string().optional(),

    // Software
    softwareAutorizado: z.string().optional(),

    // Cuenta usuario
    // cuentaUsuario: z.string().min(1, "Requerido"),
    // actividadRealiza: z.string().optional(),
    // administradorSistema: z.boolean().default(false),

    // Baja
    motivosBaja: z.string().optional(),
    fechaBaja: z.string().optional(),
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
          code: z.ZodIssueCode.custom,
          message: "Requerido cuando horario extralaboral está activo",
          path: ["extraDesde"],
        });
      }
      if (!data.extraHasta) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Requerido cuando horario extralaboral está activo",
          path: ["extraHasta"],
        });
      }
    }
  });

export type SolicitudCuentaFormData = z.infer<typeof AccountRequestSchema>;
export type AccountRequestFieldName = keyof SolicitudCuentaFormData;
export type AccountRequestValidationErrors = Partial<
  Record<AccountRequestFieldName, string[]>
>;
