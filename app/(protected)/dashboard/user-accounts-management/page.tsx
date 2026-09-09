import { getAccountsCounts } from "../services/getAccountsCount.service";
import StatsCard from "../components/stats-card";
import Link from "next/link";
import {
  Users,
  UserPlus,
  RefreshCw,
  UserMinus,
  BadgeCheck,
  Clock,
  PenLine,
  AlarmClock,
} from "lucide-react";
import LinkButton from "@/components/link-button";

interface DashboardStatCard {
  value: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  tone?: "default" | "destructive" | "amber";
}

interface DashboardSection {
  title: string;
  cards: DashboardStatCard[];
}

const sections: DashboardSection[] = [
  {
    title: "Estado de cuentas",
    cards: [
      {
        value: "pendientesFirma",
        label: "Pendientes de firma",
        icon: PenLine,
        tone: "destructive",
      },
      {
        value: "expired",
        label: "Cuentas expiradas",
        icon: AlarmClock,
        tone: "destructive",
      },
      {
        value: "expiredIn7",
        label: "Por expirar (≤7 días)",
        icon: Clock,
        tone: "amber",
      },
    ],
  },
  {
    title: "Por tipo de solicitud",
    cards: [
      { value: "alta", label: "Alta", icon: UserPlus },
      { value: "actualizacion", label: "Actualización", icon: RefreshCw },
      { value: "bajaEntidad", label: "Baja", icon: UserMinus },
    ],
  },
  {
    title: "Por tipo de cuenta",
    cards: [
      { value: "permanente", label: "Cuentas permanentes", icon: BadgeCheck },
      { value: "temporal", label: "Cuentas temporales", icon: Clock },
    ],
  },
];

function sectionGridClassName(cardCount: number): string | undefined {
  if (cardCount === 2) return "grid gap-6 sm:grid-cols-2";
  return "grid gap-6 sm:grid-cols-2 lg:grid-cols-3";
}

function StatCardLink({ card, count }: { card: DashboardStatCard; count: number }) {
  return (
    <Link
      className="transition-all duration-100 ease-in hover:scale-105"
      href={`/dashboard/user-accounts-management/users?filter=${encodeURIComponent(card.value)}`}
    >
      <StatsCard title={card.label} statData={count} icon={card.icon} tone={card.tone} />
    </Link>
  );
}

function TotalAccountsLink({ count }: { count: number }) {
  return (
    <Link
      className="text-brand bg-brand/5 inline-flex items-center gap-2 rounded-full border border-brand/20 px-4 py-1.5 text-sm font-medium transition-colors hover:bg-brand/10"
      href="/dashboard/user-accounts-management/users?filter=all"
      title="Ver todas las cuentas"
    >
      <Users className="size-4" />
      {count}
    </Link>
  );
}

export default async function UserAccountsManagementPage() {
  const counts = await getAccountsCounts();
  const total = counts["all"] ?? 0;

  return (
    <div className="mb-8 flex flex-col gap-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-semibold">
            Gestión de cuentas de usuario
          </h1>
          <TotalAccountsLink count={total} />
        </div>
        <LinkButton
          className="rounded-md px-6 py-3 text-center"
          type="success"
          href="/dashboard/user-accounts-management/users/create/"
        >
          Crear cuenta
        </LinkButton>
      </header>

      <article className="space-y-10">
        {sections.map((section) => (
          <section key={section.title} className="w-full space-y-4">
            <h2 className="text-lg font-semibold">{section.title}</h2>
            <div className={sectionGridClassName(section.cards.length)}>
              {section.cards.map((card) => (
                <StatCardLink
                  key={card.value}
                  card={card}
                  count={counts[card.value] ?? 0}
                />
              ))}
            </div>
          </section>
        ))}
      </article>
    </div>
  );
}