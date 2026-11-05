import type { Prisma } from "@/lib/db";
import {
  expiredAt,
  expiringWithin,
  pendingSignature,
} from "@/modules/accounts/queries";

export const FILTER_VALUES = [
  "all",
  "new",
  "update",
  "deprovisioning",
  "permanent",
  "temporary",
  "pendingSignature",
  "expired",
  "expiredIn7",
  "expiredIn1",
] as const;

export type FilterValue = (typeof FILTER_VALUES)[number];

export function isFilterValue(value: string): value is FilterValue {
  return (FILTER_VALUES as readonly string[]).includes(value);
}

export interface FilterConfig {
  value: FilterValue;
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
    where: pendingSignature(),
  },
];

export function getExpiredFilter(now = new Date()): FilterConfig {
  return {
    value: "expired",
    label: "Cuentas expiradas",
    where: expiredAt(now),
  };
}

export function getExpiringIn7DaysFilter(now = new Date()): FilterConfig {
  return {
    value: "expiredIn7",
    label: "Expiran en <=7 dias",
    where: expiringWithin(now, 7),
  };
}

export function getExpiringIn1DayFilter(now = new Date()): FilterConfig {
  return {
    value: "expiredIn1",
    label: "Expiran en <=1 dias",
    where: expiringWithin(now, 1),
  };
}

const staticFilters: FilterConfig[] = [
  ...filtersByRequestType,
  ...filtersByAccountType,
  ...pendingSignatureFilter,
];

export function getFilterConfig(
  value: FilterValue,
  now = new Date(),
): FilterConfig {
  const staticFilter = staticFilters.find((f) => f.value === value);
  if (staticFilter) return staticFilter;

  if (value === "expired") return getExpiredFilter(now);
  if (value === "expiredIn7") return getExpiringIn7DaysFilter(now);
  if (value === "expiredIn1") return getExpiringIn1DayFilter(now);

  return filtersByAllUsers[0];
}
