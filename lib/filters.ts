import type { Prisma } from "@/generated/prisma/client";

export interface FilterConfig {
  value: string;
  label: string;
  where: Prisma.AccountRequestWhereInput;
}

export const FILTERS: FilterConfig[] = [
  { value: "all", label: "Total de usuarios", where: {} },
  {
    value: "adminRed",
    label: "Administradores de red",
    where: { adminRed: true },
  },
  { value: "facebook", label: "Con facebook", where: { facebook: true } },
  {
    value: "correoNacional",
    label: "Con correo nacional",
    where: { correoNacional: true },
  },
  {
    value: "alta",
    label: "Solicitudes de alta",
    where: { tipoSolicitud: "ALTA" },
  },
  {
    value: "actualizacion",
    label: "Solicitudes de actualización",
    where: { tipoSolicitud: "ACTUALIZACION" },
  },
  {
    value: "modificacion",
    label: "Solicitudes de modificación",
    where: { tipoSolicitud: "MODIFICACION" },
  },
  {
    value: "directivo",
    label: "Directivos",
    where: { tipoPersonal: "DIRECTIVO" },
  },
  {
    value: "especialista_principal",
    label: "Especialistas principales",
    where: { tipoPersonal: "ESPECIALISTA_PRINCIPAL" },
  },
  { value: "tecnico", label: "Técnicos", where: { tipoPersonal: "TECNICO" } },
  {
    value: "otro",
    label: "Otros tipos de personal",
    where: { tipoPersonal: "OTRO" },
  },
  {
    value: "permanente",
    label: "Cuentas permanentes",
    where: { tipoCuenta: "PERMANENTE" },
  },
  {
    value: "temporal",
    label: "Cuentas temporales",
    where: { tipoCuenta: "TEMPORAL" },
  },
  {
    value: "correoInternacional",
    label: "Con correo internacional",
    where: { correoInternacional: true },
  },
  {
    value: "bajaEntidad",
    label: "Usuarios dados de baja",
    where: { bajaEntidad: true },
  },
  {
    value: "pendientesFirma",
    label: "Pendientes de firma",
    where: { ejecutadoFecha: null },
  },
];

export function getFilter(value: string) {
  return FILTERS.find((f) => f.value === value);
}
