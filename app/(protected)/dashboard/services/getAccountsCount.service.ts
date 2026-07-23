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

export interface AccountsCounts {
  allUsersCount: number;
  usersRequestTypeCount: number[];
  usersAccountTypeCount: number[];
  usersPendingSignatureCount: number[];
  expiredAccounts: number;
  expiring7Count: number;
  expiring1Count: number;
}

export async function getAccountsCounts(): Promise<AccountsCounts> {
  const [
    allUsersCount,
    usersRequestTypeCount,
    usersAccountTypeCount,
    usersPendingSignatureCount,
    expiredAccounts,
    expiring7Count,
    expiring1Count,
  ] = await Promise.all([
    prisma.accountRequest.count({ where: filtersByAllUsers[0].where }),
    Promise.all(
      filtersByRequestType.map((f) =>
        prisma.accountRequest.count({ where: f.where }),
      ),
    ),
    Promise.all(
      filtersByAccountType.map((f) =>
        prisma.accountRequest.count({ where: f.where }),
      ),
    ),
    Promise.all(
      pendingSignatureFilter.map((f) =>
        prisma.accountRequest.count({ where: f.where }),
      ),
    ),
    prisma.accountRequest.count({ where: getExpiredFilter().where }),
    prisma.accountRequest.count({ where: getExpiringIn7DaysFilter().where }),
    prisma.accountRequest.count({ where: getExpiringIn1DayFilter().where }),
  ]);

  return {
    allUsersCount,
    usersRequestTypeCount,
    usersAccountTypeCount,
    usersPendingSignatureCount,
    expiredAccounts,
    expiring7Count,
    expiring1Count,
  };
}
