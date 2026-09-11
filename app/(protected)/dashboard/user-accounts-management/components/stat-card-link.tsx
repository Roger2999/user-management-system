import Link from "next/link";
import StatsCard from "../../components/stats-card";
import type { DashboardStatCard } from "./dashboard-sections";

export default function StatCardLink({
  card,
  count,
}: {
  card: DashboardStatCard;
  count: number;
}) {
  return (
    <Link
      className="transition-all duration-100 ease-in hover:scale-102"
      href={`/dashboard/user-accounts-management/users?filter=${encodeURIComponent(card.value)}`}
    >
      <StatsCard
        title={card.label}
        statData={count}
        icon={card.icon}
        tone={card.tone}
      />
    </Link>
  );
}
