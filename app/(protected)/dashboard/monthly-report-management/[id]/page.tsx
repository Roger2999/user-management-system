import {
  FindingDisposition,
  ReportStatus,
} from "@/generated/prisma/enums";
import { MONTHS } from "@/lib/reports/document/period";
import prisma from "@/lib/prisma";
import Link from "next/link";
import { regenerateReportAction, updateFindingAction } from "../actions";

const STATUS_LABEL: Record<ReportStatus, string> = {
  DRAFT: "Borrador",
  REVIEW: "En revisión",
  APPROVED: "Aprobado",
  EXPORTED: "Exportado",
};

const DISPOSITION_LABEL: Record<FindingDisposition, string> = {
  PENDING: "Pendiente",
  CONFIRMED: "Confirmado",
  FALSE_POSITIVE: "Falso positivo",
  ACTION_TAKEN: "Acción tomada",
};

const CATEGORY_LABEL: Record<string, string> = {
  ADULT: "Adultos",
  SUBVERSIVE: "C/R o subversivo",
  ANON_PROXY: "Proxy anónimo",
  MINING: "Minería",
};

type Snapshot = {
  declarations?: {
    skipped?: { unserved: number; internal: number; telemetry: number };
    browsingTimeApproximate?: boolean;
    incompleteCoverage?: boolean;
  };
  coverage?: { missingDays?: string[]; extraDays?: string[] };
};

function format(value: number): string {
  return value.toLocaleString("es-CU");
}

export default async function ReportDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;

  const include = {
    findings: {
      include: { categoryRule: true, proxyAccount: true },
      orderBy: [{ hits: "desc" as const }],
    },
  };

  const report = await prisma.monthlyReport.findUnique({
    where: { id },
    include,
  });

  if (report === null) {
    return (
      <div className="w-full max-w-3xl space-y-4 p-2">
        <Link
          href="/dashboard/monthly-report-management"
          className="text-muted-foreground text-sm hover:underline"
        >
          ← Informes
        </Link>
        <h1 className="text-2xl font-semibold">Informe no encontrado</h1>
        <p className="text-muted-foreground text-sm">
          No existe un informe con el identificador{" "}
          <code className="break-all">{id}</code>.{" "}
          <Link
            href="/dashboard/monthly-report-management"
            className="text-primary underline-offset-4 hover:underline"
          >
            Volver a la lista
          </Link>
          .
        </p>
      </div>
    );
  }

  const snapshot = (report.snapshot ?? {}) as Snapshot;
  const skipped = snapshot.declarations?.skipped;
  const missing = snapshot.coverage?.missingDays ?? [];
  const extra = snapshot.coverage?.extraDays ?? [];

  return (
    <div className="w-full max-w-6xl space-y-6 p-2">
      <Link
        href="/dashboard/monthly-report-management"
        className="text-muted-foreground text-sm hover:underline"
      >
        ← Informes
      </Link>
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-muted-foreground text-sm capitalize">
            {MONTHS[report.month - 1]} {report.year}
          </p>
          <h1 className="text-2xl font-semibold">Informe mensual</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Estado: <strong>{STATUS_LABEL[report.status]}</strong>
            {report.issuedOn !== null &&
              ` · Emitido el ${report.issuedOn.toLocaleDateString("es-CU")}`}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {report.docxSha256 === null ? (
            <span className="text-muted-foreground text-sm">
              Sin documento emitido
            </span>
          ) : (
            <a
              href={`/api/reports/${report.id}/document`}
              className="bg-primary text-primary-foreground rounded-md px-4 py-2 text-sm"
            >
              Descargar .docx
            </a>
          )}
          <form action={regenerateReportAction}>
            <input type="hidden" name="reportId" value={report.id} />
            <input type="hidden" name="year" value={report.year} />
            <input type="hidden" name="month" value={report.month} />
            <button
              type="submit"
              className="rounded-md border px-4 py-2 text-sm"
            >
              Regenerar
            </button>
          </form>
        </div>
      </header>

      {error !== undefined && (
        <p className="border-destructive/40 bg-destructive/10 text-destructive rounded-lg border px-4 py-3 text-sm">
          {error}
        </p>
      )}

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border p-4">
          <p className="text-muted-foreground text-xs uppercase">Cobertura</p>
          <p className="mt-1 text-lg font-semibold">
            {report.coverageDaysImported} de {report.coverageDaysExpected} días
          </p>
          <p className="text-muted-foreground mt-1 text-xs">
            {missing.length > 0
              ? `Faltan: ${missing.join(", ")}`
              : "Sin días faltantes"}
          </p>
          {extra.length > 0 && (
            <p className="text-muted-foreground mt-1 text-xs">
              Ajenos (no sumados): {extra.join(", ")}
            </p>
          )}
        </div>

        <div className="rounded-xl border p-4">
          <p className="text-muted-foreground text-xs uppercase">Hits</p>
          <p className="mt-1 text-lg font-semibold tabular-nums">
            {format(Number(report.totalHits))}
          </p>
          <p className="text-muted-foreground mt-1 text-xs">
            Sin cuenta: {format(Number(report.unidentifiedHits))}
          </p>
        </div>

        <div className="rounded-xl border p-4">
          <p className="text-muted-foreground text-xs uppercase">
            Descartes y telemetría
          </p>
          {skipped === undefined ? (
            <p className="text-muted-foreground mt-1 text-sm">
              Sin desglose guardado
            </p>
          ) : (
            <ul className="mt-1 space-y-0.5 text-sm tabular-nums">
              <li>No servidas: {format(skipped.unserved)}</li>
              <li>Internas: {format(skipped.internal)}</li>
              <li>
                Telemetría (fuera de las tablas): {format(skipped.telemetry)}
              </li>
            </ul>
          )}
        </div>

        <div className="rounded-xl border p-4">
          <p className="text-muted-foreground text-xs uppercase">
            Browsing Time
          </p>
          <p className="mt-1 text-sm font-semibold">
            {snapshot.declarations?.browsingTimeApproximate === true
              ? "Aproximado (sin calibrar)"
              : "Calibrado"}
          </p>
          <p className="text-muted-foreground mt-1 text-xs">
            {snapshot.declarations?.incompleteCoverage === true
              ? "El informe declara cobertura incompleta"
              : "Cobertura completa"}
          </p>
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-lg font-semibold">
              Hallazgos ({report.findings.length})
            </h2>
            <p className="text-muted-foreground text-sm">
              Categorías prohibidas detectadas con las reglas activas. La
              revisión se conserva al regenerar.
            </p>
          </div>
        </div>

        {report.findings.length === 0 ? (
          <p className="text-muted-foreground rounded-xl border border-dashed p-8 text-center text-sm">
            Sin coincidencias con las reglas activas.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-xl border">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/50 text-muted-foreground text-xs uppercase">
                <tr>
                  <th className="px-4 py-3 font-medium">Categoría</th>
                  <th className="px-4 py-3 font-medium">Sitio</th>
                  <th className="px-4 py-3 font-medium">Usuario</th>
                  <th className="px-4 py-3 text-right font-medium">Hits</th>
                  <th className="px-4 py-3 font-medium">Visto</th>
                  <th className="px-4 py-3 font-medium">Revisión</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {report.findings.map((finding) => (
                  <tr key={finding.id} className="align-top">
                    <td className="px-4 py-3">
                      {CATEGORY_LABEL[finding.categoryRule.category] ??
                        finding.categoryRule.category}
                    </td>
                    <td className="px-4 py-3 break-all">{finding.url}</td>
                    <td className="px-4 py-3">
                      {finding.proxyAccountId ?? "sin cuenta"}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {format(finding.hits)}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {finding.firstSeen.toLocaleDateString("es-CU")} —{" "}
                      {finding.lastSeen.toLocaleDateString("es-CU")}
                    </td>
                    <td className="px-4 py-3">
                      <form
                        action={updateFindingAction}
                        className="flex flex-wrap items-center gap-2"
                      >
                        <input
                          type="hidden"
                          name="findingId"
                          value={finding.id}
                        />
                        <select
                          name="disposition"
                          defaultValue={finding.disposition}
                          className="bg-background rounded-md border px-2 py-1 text-xs"
                        >
                          {Object.entries(DISPOSITION_LABEL).map(
                            ([value, label]) => (
                              <option key={value} value={value}>
                                {label}
                              </option>
                            ),
                          )}
                        </select>
                        <input
                          name="measure"
                          defaultValue={finding.measure ?? ""}
                          placeholder="Medida adoptada"
                          className="bg-background w-40 rounded-md border px-2 py-1 text-xs"
                        />
                        <button
                          type="submit"
                          className="rounded-md border px-2 py-1 text-xs"
                        >
                          Guardar
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
