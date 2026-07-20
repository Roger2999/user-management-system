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
    where: {
      OR: [
        { firmadoPorAprobado: false },
        { firmadoPorEjecutado: false },
        { firmadoPorRevisado: false },
        { firmadoPorSolicitado: false },
      ],
    },
  },
];
export const filtersByExpired: FilterConfig[] = [
  {
    value: "expired",
    label: "Cuentas expiradas",
    where: {
      tipoCuenta: "TEMPORAL",
      fechaExpiracion: {
        lte: new Date(),
      },
    },
  },
  {
    value: "expiredIn7",
    label: "Expiran en ≤7 días",
    where: {
      tipoCuenta: "TEMPORAL",
      fechaExpiracion: {
        gte: new Date(),
        lte: new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000),
      },
    },
  },
  {
    value: "expiredIn1",
    label: "Expiran en ≤1 días",
    where: {
      tipoCuenta: "TEMPORAL",
      fechaExpiracion: {
        gte: new Date(),
        lte: new Date(new Date().getTime() + 24 * 60 * 60 * 1000),
      },
    },
  },
];

export const allFilters: FilterConfig[] = [
  ...filtersByRequestType,
  ...filtersByAccountType,
  ...filtersByExpired,
  ...pendingSignatureFilter,
];

export function getFilterConfig(value: string): FilterConfig {
  return allFilters.find((f) => f.value === value) ?? filtersByAllUsers[0];
}
