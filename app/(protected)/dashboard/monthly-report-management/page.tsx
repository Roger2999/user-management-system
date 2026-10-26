import { ReportStatus } from "@/generated/prisma/enums";
import { MONTHS } from "@/lib/reports/document/period";
import prisma from "@/lib/prisma";
import Link from "next/link";

const STATUS_LABEL: Record<ReportStatus, string> = {
  DRAFT: "Borrador",
  REVIEW: "En revisión",
  APPROVED: "Aprobado",
  EXPORTED: "Exportado",
};

function format(value: bigint | number): string {
  return value.toLocaleString("es-CU");
}

export default async function MonthlyReportManagementPage() {
  const reports = await prisma.monthlyReport.findMany({
    orderBy: [{ year: "desc" }, { month: "desc" }],
    include: { _count: { select: { findings: true } } },
  });

  return (
    <div className="w-full max-w-5xl space-y-6 p-2">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Informes mensuales</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Un informe por mes calendario local. Regenerarlo actualiza el mismo
            registro y conserva la revisión de los hallazgos.
          </p>
        </div>
        <Link
          href="/dashboard/monthly-report-management/new"
          className="bg-primary text-primary-foreground rounded-md px-4 py-2 text-sm"
        >
          Nuevo informe
        </Link>
      </header>

      {reports.length === 0 ? (
        <p className="text-muted-foreground rounded-xl border border-dashed p-10 text-center text-sm">
          Todavía no hay informes. Importá los logs del mes y generá el primero.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/50 text-muted-foreground text-xs uppercase">
              <tr>
                <th className="px-4 py-3 font-medium">Período</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3 font-medium">Cobertura</th>
                <th className="px-4 py-3 text-right font-medium">Hits</th>
                <th className="px-4 py-3 text-right font-medium">Hallazgos</th>
                <th className="px-4 py-3 font-medium">Emitido</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {reports.map((report) => (
                <tr key={report.id}>
                  <td className="px-4 py-3 font-medium capitalize">
                    {MONTHS[report.month - 1]} {report.year}
                  </td>
                  <td className="px-4 py-3">{STATUS_LABEL[report.status]}</td>
                  <td className="px-4 py-3">
                    {report.coverageDaysImported} de{" "}
                    {report.coverageDaysExpected} días
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {format(report.totalHits)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {report._count.findings}
                  </td>
                  <td className="px-4 py-3">
                    {report.issuedOn?.toLocaleDateString("es-CU") ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/dashboard/monthly-report-management/${report.id}`}
                      className="text-primary underline-offset-4 hover:underline"
                    >
                      Ver
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
