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

export function getExpiredFilter(): FilterConfig {
  return {
    value: "expired",
    label: "Cuentas expiradas",
    where: {
      tipoCuenta: "TEMPORAL",
      fechaExpiracion: { lte: new Date() },
    },
  };
}

export function getExpiringIn7DaysFilter(): FilterConfig {
  const now = new Date();
  const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  return {
    value: "expiredIn7",
    label: "Expiran en <=7 dias",
    where: {
      tipoCuenta: "TEMPORAL",
      fechaExpiracion: { gte: now, lte: in7Days },
    },
  };
}

export function getExpiringIn1DayFilter(): FilterConfig {
  const now = new Date();
  const in1Day = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  return {
    value: "expiredIn1",
    label: "Expiran en <=1 dias",
    where: {
      tipoCuenta: "TEMPORAL",
      fechaExpiracion: { gte: now, lte: in1Day },
    },
  };
}

const staticFilters: FilterConfig[] = [
  ...filtersByRequestType,
  ...filtersByAccountType,
  ...pendingSignatureFilter,
];

export function getFilterConfig(value: string): FilterConfig {
  const staticFilter = staticFilters.find((f) => f.value === value);
  if (staticFilter) return staticFilter;

  if (value === "expired") return getExpiredFilter();
  if (value === "expiredIn7") return getExpiringIn7DaysFilter();
  if (value === "expiredIn1") return getExpiringIn1DayFilter();

  return filtersByAllUsers[0];
}
