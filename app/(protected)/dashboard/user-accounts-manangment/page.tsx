import {
  filtersByAccountType,
  filtersByRequestType,
  pendingSignatureFilter,
} from "@/lib/filters";
import prisma from "@/lib/prisma";
import StatsCard from "../components/stats-card";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  Users,
  UserPlus,
  RefreshCw,
  Pencil,
  UserMinus,
  BadgeCheck,
  Clock,
  PenLine,
} from "lucide-react";

const requestTypeIcons: Record<
  string,
  React.ComponentType<{ className?: string }>
> = {
  alta: UserPlus,
  actualizacion: RefreshCw,
  Modificacion: Pencil,
  bajaEntidad: UserMinus,
};

const accountTypeIcons: Record<
  string,
  React.ComponentType<{ className?: string }>
> = {
  permanente: BadgeCheck,
  temporal: Clock,
};

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
    <div className="flex flex-col items-center gap-10">
      <header className="w-full space-y-2">
        <h1 className="text-center text-3xl font-semibold">
          Gestión de cuentas de usuario
        </h1>
        <h2 className="text-muted-foreground text-center text-xl font-medium">
          Empresa Eléctrica de Matanzas — resumen de solicitudes
        </h2>
      </header>
      <article className="w-full max-w-5xl">
        <section className="flex w-full flex-col gap-4">
          <Link
            href={`/dashboard/user-accounts-manangment/users?filter=${encodeURIComponent("all")}`}
            className="transition-all duration-100 ease-in hover:scale-[1.02]"
          >
            <StatsCard
              title="Total de cuentas"
              statData={allUsersCount}
              icon={Users}
            />
          </Link>
        </section>

        <section className="w-full space-y-4">
          <h2 className="text-lg font-semibold">Por tipo de solicitud</h2>
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
                  icon={requestTypeIcons[filter.value]}
                />
              </Link>
            ))}
          </div>
        </section>

        <section className="w-full space-y-4">
          <h2 className="text-lg font-semibold">Por tipo de cuenta</h2>
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
                  icon={accountTypeIcons[filter.value]}
                />
              </Link>
            ))}
          </div>
        </section>

        {usersPendingSignatureCount[0] > 0 && (
          <section className="w-full space-y-4">
            <h2 className="text-lg font-semibold">Pendientes de firma</h2>
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
                    icon={PenLine}
                    className={cn(
                      usersPendingSignatureCount[i] !== 0 &&
                        "bg-destructive/20",
                    )}
                  />
                </Link>
              ))}
            </div>
          </section>
        )}
      </article>
    </div>
  );
}
