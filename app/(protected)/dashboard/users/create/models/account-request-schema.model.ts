import { z } from "zod";

export const AccountRequestSchema = z
  .object({
    // Encabezado
    tipoSolicitud: z.enum(["ALTA", "ACTUALIZACION", "MODIFICACION"]),
    folio: z.string().min(1, "Requerido"),

    // Datos personales
    nombreApellidos: z.string().min(1, "Requerido"),
    cargoOcupa: z.string().min(1, "Requerido"),
    departamentoArea: z.string().min(1, "Requerido"),
    tipoPersonal: z.enum([
      "DIRECTIVO",
      "ESPECIALISTA_PRINCIPAL",
      "TECNICO",
      "OTRO",
    ]),
    cuenta: z.string().optional(),

    // Correo
    correoLocal: z.boolean().default(false),
    correoNacional: z.boolean().default(false),
    correoInternacional: z.boolean().default(false),
    correoInternet: z.boolean().default(false),
    correoInternetFechaTemp: z.string().optional(),

    // Navegación
    intranetUNE: z.boolean().default(false),
    intranetNacional: z.boolean().default(false),
    internet: z.boolean().default(false),
    internetFechaTemp: z.string().optional(),

    // Mensajería
    mensajeriaCorporativa: z.boolean().default(false),
    chatInternet: z.boolean().default(false),
    chatInternetFechaTemp: z.string().optional(),

    // Redes sociales
    facebook: z.boolean().default(false),
    twitter: z.boolean().default(false),
    youtube: z.boolean().default(false),
    otrasRedes: z.string().optional(),

    // Privilegios
    adminRed: z.boolean().default(false),
    adminLocal: z.boolean().default(false),
    usuarioAvanzado: z.boolean().default(false),

    // FTP UNE
    ftpUneLectura: z.boolean().default(false),
    ftpUneModificar: z.boolean().default(false),
    ftpUneBorrar: z.boolean().default(false),

    // FTP Entidad
    ftpEntidadLectura: z.boolean().default(false),
    ftpEntidadModificar: z.boolean().default(false),
    ftpEntidadBorrar: z.boolean().default(false),

    // Tipo cuenta
    tipoCuenta: z.enum(["PERMANENTE", "TEMPORAL"]),
    fechaExpiracion: z.string().optional(),

    // Horarios
    horarioExtralaboral: z.boolean().default(false),
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
    cuentaUsuario: z.string().optional(),
    actividadRealiza: z.string().optional(),
    administradorSistema: z.boolean().default(false),

    // Firmas
    solicitadoNombre: z.string().optional(),
    solicitadoCargo: z.string().optional(),
    solicitadoFecha: z.string().optional(),
    revisadoNombre: z.string().optional(),
    revisadoCargo: z.string().optional(),
    revisadoFecha: z.string().optional(),
    aprobadoNombre: z.string().optional(),
    aprobadoCargo: z.string().optional(),
    aprobadoFecha: z.string().optional(),
    ejecutadoNombre: z.string().optional(),
    ejecutadoCargo: z.string().optional(),
    ejecutadoFecha: z.string().optional(),

    // Baja
    bajaEntidad: z.boolean().default(false),
    motivosBaja: z.string().optional(),
    fechaBaja: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.correoInternet && !data.correoInternetFechaTemp) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Requerido cuando correo internet está activo",
        path: ["correoInternetFechaTemp"],
      });
    }

    if (data.internet && !data.internetFechaTemp) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Requerido cuando internet está activo",
        path: ["internetFechaTemp"],
      });
    }

    if (data.chatInternet && !data.chatInternetFechaTemp) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Requerido cuando chat internet está activo",
        path: ["chatInternetFechaTemp"],
      });
    }

    if (data.tipoCuenta === "TEMPORAL" && !data.fechaExpiracion) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
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
