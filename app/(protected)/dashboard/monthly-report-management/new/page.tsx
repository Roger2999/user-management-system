import { listImportedDays } from "@/lib/reports/persistence/load";
import prisma from "@/lib/prisma";
import { checkCoverage, monthlyPeriod, toLocalDay } from "@/lib/reports/time";
import PrepareMonth from "../components/prepare-month";

export default async function NewReportPage() {
  // Componente de servidor: se renderiza una vez por petición, así que leer el
  // reloj acá no produce el re-render inestable que la regla de pureza evita.
  // eslint-disable-next-line react-hooks/purity
  const today = toLocalDay(Date.now());
  const year = Number(today.slice(0, 4));
  const month = Number(today.slice(5, 7));

  const period = monthlyPeriod(year, month);
  const presentDays = await listImportedDays(prisma, period);

  return (
    <PrepareMonth
      defaultYear={year}
      defaultMonth={month}
      initialCoverage={checkCoverage(period, presentDays)}
    />
  );
}
