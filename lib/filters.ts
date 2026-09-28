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
    value: "new",
    label: "Alta",
    where: { requestType: "NEW" },
  },
  {
    value: "update",
    label: "Actualización",
    where: { requestType: "UPDATE" },
  },
  {
    value: "deprovisioning",
    label: "Baja",
    where: { requestType: "DEPROVISIONING" },
  },
];

export const filtersByAccountType: FilterConfig[] = [
  {
    value: "permanent",
    label: "Cuentas permanentes",
    where: { accountType: "PERMANENT" },
  },
  {
    value: "temporary",
    label: "Cuentas temporales",
    where: { accountType: "TEMPORARY" },
  },
];

export const pendingSignatureFilter: FilterConfig[] = [
  {
    value: "pendingSignature",
    label: "Pendientes de firma",
    where: {
      signatures: { none: {} },
    },
  },
];

export function getExpiredFilter(): FilterConfig {
  return {
    value: "expired",
    label: "Cuentas expiradas",
    where: {
      accountType: "TEMPORARY",
      expiresAt: { lte: new Date() },
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
      accountType: "TEMPORARY",
      expiresAt: { gte: now, lte: in7Days },
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
      accountType: "TEMPORARY",
      expiresAt: { gte: now, lte: in1Day },
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
