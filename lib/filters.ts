import type { Prisma } from "@/generated/prisma/client";

export interface FilterConfig {
  value: string;
  label: string;
  where: Prisma.AccountRequestWhereInput;
}

export const filtersByAllUsers: FilterConfig[] = [
  { value: "all", label: "Total de cuentas", where: {} },
];

export const filtersByRequestType: FilterConfig[] = [
  {
    value: "alta",
    label: "Alta",
    where: { tipoSolicitud: "ALTA" },
  },
  {
    value: "actualizacion",
    label: "Actualización",
    where: { tipoSolicitud: "ACTUALIZACION" },
  },
  {
    value: "Modificacion",
    label: "Modificación",
    where: { tipoSolicitud: "MODIFICACION" },
  },
  {
    value: "bajaEntidad",
    label: "Baja",
    where: { bajaEntidad: true },
  },
];
export const filtersByAccountType: FilterConfig[] = [
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
];
export const pendingSignatureFilter: FilterConfig[] = [
  {
    value: "pendientesFirma",
    label: "Pendientes de firma",
    where: { ejecutadoFecha: null },
  },
];
export const allFilters: FilterConfig[] = [
  ...filtersByAllUsers,
  ...filtersByRequestType,
  ...filtersByAccountType,
  ...pendingSignatureFilter,
];

export function getFilterConfig(value: string): FilterConfig {
  return allFilters.find((f) => f.value === value) ?? filtersByAllUsers[0];
}
