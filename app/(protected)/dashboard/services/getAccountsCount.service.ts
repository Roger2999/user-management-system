import prisma from "@/lib/prisma";
import {
  filtersByAllUsers,
  filtersByRequestType,
  filtersByAccountType,
  pendingSignatureFilter,
  getExpiredFilter,
  getExpiringIn7DaysFilter,
  getExpiringIn1DayFilter,
} from "@/lib/filters";
import type { FilterConfig } from "@/lib/filters";

export async function getAccountsCounts(): Promise<Record<string, number>> {
  const expiredFilter = getExpiredFilter();
  const expiringIn7DaysFilter = getExpiringIn7DaysFilter();
  const expiringIn1DayFilter = getExpiringIn1DayFilter();

  const entries: FilterConfig[] = [
    ...filtersByAllUsers,
    ...pendingSignatureFilter,
    expiredFilter,
    expiringIn7DaysFilter,
    expiringIn1DayFilter,
    ...filtersByRequestType,
    ...filtersByAccountType,
  ];

  const counts = await Promise.all(
    entries.map((entry) => prisma.accountRequest.count({ where: entry.where })),
  );

  return Object.fromEntries(
    entries.map((entry, index) => [entry.value, counts[index]]),
  );
}
