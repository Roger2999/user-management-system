import { getSession } from "@/helpers/getSession";
import prisma from "@/lib/prisma";
import Link from "next/link";
import {
  filtersByAccountType,
  filtersByRequestType,
  pendingSignatureFilter,
} from "@/lib/filters";
import { cn } from "@/lib/utils";
import StatsCard from "./components/stats-card";

export default async function Dashboard() {
  const session = await getSession();
  const username = session?.user.name;

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
    <div className="flex flex-col items-center space-y-8 py-10">
      <header className="w-full">
        <h1 className="text-2xl font-semibold text-muted-foreground text-center">
          Bienvenido de vuelta, {username ?? "usuario"}
        </h1>
      </header>

      <section className="w-full flex flex-col gap-6">
        <Link href={`/dashboard/users?filter=${encodeURIComponent("all")}`}>
          <StatsCard title="Total de cuentas" statData={allUsersCount} />
        </Link>

        <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {filtersByRequestType.map((filter, i) => (
            <Link
              key={filter.value}
              className="transition-all duration-100 ease-in hover:scale-102"
              href={`/dashboard/users?filter=${encodeURIComponent(filter.value)}`}
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
              className="transition-all duration-100 ease-in hover:scale-102"
              href={`/dashboard/users?filter=${encodeURIComponent(filter.value)}`}
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
                className="transition-all duration-100 ease-in hover:scale-102"
                href={`/dashboard/users?filter=${encodeURIComponent(filter.value)}`}
              >
                <StatsCard
                  title={filter.label}
                  statData={usersPendingSignatureCount[i]}
                  className={cn(
                    usersPendingSignatureCount[i] !== 0 && "bg-red-500/20",
                  )}
                />
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
