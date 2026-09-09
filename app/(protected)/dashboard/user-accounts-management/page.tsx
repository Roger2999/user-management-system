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
    title: "Resumen general",
    cards: [{ value: "all", label: "Total de cuentas", icon: Users }],
  },
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
  if (cardCount === 1) return undefined;
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

export default async function UserAccountsManagementPage() {
  const counts = await getAccountsCounts();

  return (
    <div className="mb-8 flex flex-col items-center gap-6">
      <header className="w-full max-w-5xl space-y-6">
        <h1 className="text-center text-3xl font-semibold">
          Gestión de cuentas de usuario
        </h1>
        <LinkButton
          className="rounded-md px-6 py-2 text-center"
          type="success"
          href="/dashboard/user-accounts-management/users/create/"
        >
          Crear cuenta
        </LinkButton>
      </header>
      <article className="w-full max-w-5xl space-y-10">
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