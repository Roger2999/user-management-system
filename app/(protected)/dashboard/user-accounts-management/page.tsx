import { getAccountsCounts } from "../services/getAccountsCount.service";
import LinkButton from "@/components/link-button";
import StatCardLink from "./components/stat-card-link";
import TotalAccountsLink from "./components/total-accounts-link";
import { dashboardSections } from "./components/dashboard-sections";

function sectionGridClassName(cardCount: number): string | undefined {
  if (cardCount === 2) return "grid gap-6 sm:grid-cols-2";
  return "grid gap-6 sm:grid-cols-2 lg:grid-cols-3";
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
          className="rounded-md px-10 py-3 text-center"
          type="success"
          href="/dashboard/user-accounts-management/users/create/"
        >
          Crear cuenta
        </LinkButton>
      </header>

      <article className="space-y-10">
        {dashboardSections.map((section) => (
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
