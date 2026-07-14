import {
  filtersByAccountType,
  filtersByRequestType,
  pendingSignatureFilter,
} from "@/lib/filters";
import prisma from "@/lib/prisma";
import StatsCard from "../components/stats-card";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default async function UserAccountsManangmentPage() {
  const allUsersCount = await prisma.accountRequest.count();

  const usersRequesTypeCount = await Promise.all(
    filtersByRequestType.map((f) =>
      prisma.accountRequest.count({ where: f.where }),
    ),
  );
  const usersAccountTypeCount = await Promise.all(
    filtersByAccountType.map((f) =>
      prisma.accountRequest.count({ where: f.where }),
    ),
  );
  const usersPendingSignatureCount = await Promise.all(
    pendingSignatureFilter.map((f) =>
      prisma.accountRequest.count({ where: f.where }),
    ),
  );
  return (
    <>
      <section className="w-full flex flex-col gap-6">
        <Link
          href={`/dashboard/user-accounts-manangment/users?filter=${encodeURIComponent("all")}`}
        >
          <StatsCard title="Total de cuentas" statData={allUsersCount} />
        </Link>

        <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {filtersByRequestType.map((filter, i) => (
            <Link
              key={filter.value}
              className="transition-all duration-100 ease-in hover:scale-105"
              href={`/dashboard/user-accounts-manangment/users?filter=${encodeURIComponent(filter.value)}`}
            >
              <StatsCard
                title={filter.label}
                statData={usersRequesTypeCount[i]}
              />
            </Link>
          ))}
        </div>
      </section>

      <section className="w-full space-y-4">
        <div className="grid gap-6 sm:grid-cols-2">
          {filtersByAccountType.map((filter, i) => (
            <Link
              key={filter.value}
              className="transition-all duration-100 ease-in hover:scale-105"
              href={`/dashboard/user-accounts-manangment/users?filter=${encodeURIComponent(filter.value)}`}
            >
              <StatsCard
                title={filter.label}
                statData={usersAccountTypeCount[i]}
              />
            </Link>
          ))}
        </div>
      </section>

      {usersPendingSignatureCount[0] > 0 && (
        <section className="w-full space-y-4">
          <div className="grid gap-4">
            {pendingSignatureFilter.map((filter, i) => (
              <Link
                key={filter.value}
                className="transition-all duration-100 ease-in hover:scale-105"
                href={`/dashboard/user-accounts-manangment/users?filter=${encodeURIComponent(filter.value)}`}
              >
                <StatsCard
                  title={filter.label}
                  statData={usersPendingSignatureCount[i]}
                  className={cn(
                    usersPendingSignatureCount[i] !== 0 && "bg-destructive/20",
                  )}
                />
              </Link>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
