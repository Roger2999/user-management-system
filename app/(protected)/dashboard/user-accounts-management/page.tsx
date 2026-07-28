import { filtersByAccountType, filtersByRequestType } from "@/lib/filters";
import { getAccountsCounts } from "../services/getAccountsCount.service";
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
  AlarmClock,
} from "lucide-react";
import LinkButton from "@/components/link-button";

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
  const counts = await getAccountsCounts();

  return (
    <div className="mb-8 flex flex-col items-center gap-6">
      <header className="w-full max-w-5xl space-y-6">
        <h1 className="text-center text-3xl font-semibold">
          Gestión de cuentas de usuario
        </h1>
        <LinkButton
          className="px-6 py-2 text-center"
          type="success"
          href="/dashboard/user-accounts-management/users/create/"
        >
          Crear cuenta
        </LinkButton>
      </header>
      <article className="w-full max-w-5xl space-y-10">
        <section className="flex w-full flex-col gap-4">
          <h2 className="text-lg font-semibold">Resumen general</h2>
          <Link
            href={`/dashboard/user-accounts-management/users?filter=${encodeURIComponent("all")}`}
            className="transition-all duration-100 ease-in hover:scale-[1.02]"
          >
            <StatsCard
              title="Total de cuentas"
              statData={counts.allUsersCount}
              icon={Users}
            />
          </Link>
        </section>

        <section className="w-full space-y-4">
          <h2 className="text-lg font-semibold">Estado de cuentas</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <Link
              className="transition-all duration-100 ease-in hover:scale-105"
              href={`/dashboard/user-accounts-management/users?filter=${encodeURIComponent("pendientesFirma")}`}
            >
              <StatsCard
                title="Pendientes de firma"
                statData={counts.usersPendingSignatureCount[0]}
                icon={PenLine}
                className={cn("bg-destructive/20")}
              />
            </Link>
            <Link
              className="transition-all duration-100 ease-in hover:scale-105"
              href={`/dashboard/user-accounts-management/users?filter=${encodeURIComponent("expired")}`}
            >
              <StatsCard
                title="Cuentas expiradas"
                statData={counts.expiredAccounts}
                icon={AlarmClock}
                className={cn(
                  counts.expiredAccounts > 0 && "bg-destructive/20",
                )}
              />
            </Link>
            <Link
              className="transition-all duration-100 ease-in hover:scale-105"
              href={`/dashboard/user-accounts-management/users?filter=${encodeURIComponent("expiredIn7")}`}
            >
              <StatsCard
                title="Por expirar (≤7 días)"
                statData={counts.expiring7Count}
                icon={Clock}
                className={cn(counts.expiring7Count > 0 && "bg-amber-500/20")}
              />
            </Link>
          </div>
        </section>

        <section className="w-full space-y-4">
          <h2 className="text-lg font-semibold">Por tipo de solicitud</h2>
          <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3">
            {filtersByRequestType.map((filter, i) => (
              <Link
                key={filter.value}
                className="transition-all duration-100 ease-in hover:scale-105"
                href={`/dashboard/user-accounts-management/users?filter=${encodeURIComponent(filter.value)}`}
              >
                <StatsCard
                  title={filter.label}
                  statData={counts.usersRequestTypeCount[i]}
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
                href={`/dashboard/user-accounts-management/users?filter=${encodeURIComponent(filter.value)}`}
              >
                <StatsCard
                  title={filter.label}
                  statData={counts.usersAccountTypeCount[i]}
                  icon={accountTypeIcons[filter.value]}
                />
              </Link>
            ))}
          </div>
        </section>
      </article>
    </div>
  );
}
