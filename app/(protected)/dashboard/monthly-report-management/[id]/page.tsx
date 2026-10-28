import { FindingDisposition, RuleCategory } from "@/generated/prisma/enums";
import { MONTHS } from "@/lib/reports/document/period";
import prisma from "@/lib/prisma";
import Link from "next/link";
import {
  regenerateReportAction,
  updateFindingAction,
  updateFindingsAction,
} from "../actions";

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

function periodTitle(month: number, year: number): string {
  const name = MONTHS[month - 1] ?? "";
  return `${name.charAt(0).toUpperCase()}${name.slice(1)} ${year}`;
}

function isCategory(value: string | undefined): value is RuleCategory {
  return value !== undefined && value in RuleCategory;
}

function isDisposition(value: string | undefined): value is FindingDisposition {
  return value !== undefined && value in FindingDisposition;
}

export default async function ReportDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    error?: string;
    categoria?: string;
    revision?: string;
  }>;
}) {
  const { id } = await params;
  const { error, categoria, revision } = await searchParams;

  const category = isCategory(categoria) ? categoria : "";
  const disposition = isDisposition(revision) ? revision : "";

  const filter =
    category === "" && disposition === ""
      ? {}
      : {
          ...(category === ""
            ? {}
            : { categoryRule: { category: category as RuleCategory } }),
          ...(disposition === ""
            ? {}
            : { disposition: disposition as FindingDisposition }),
        };

  const report = await prisma.monthlyReport.findUnique({
    where: { id },
    include: {
      findings: {
        where: filter,
        include: { categoryRule: true, proxyAccount: true },
        orderBy: [{ hits: "desc" }],
      },
    },
  });

  if (report === null) {
    return (
      <div className="w-full max-w-3xl space-y-4 p-2">
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

  const [totalFindings, byDisposition] = await Promise.all([
    prisma.reportFinding.count({ where: { monthlyReportId: report.id } }),
    prisma.reportFinding.groupBy({
      by: ["disposition"],
      where: { monthlyReportId: report.id },
      _count: { _all: true },
    }),
  ]);

  const pendingFindings =
    byDisposition.find((row) => row.disposition === "PENDING")?._count._all ??
    0;

  const snapshot = (report.snapshot ?? {}) as Snapshot;
  const skipped = snapshot.declarations?.skipped;
  const missing = snapshot.coverage?.missingDays ?? [];
  const extra = snapshot.coverage?.extraDays ?? [];

  const filters = new URLSearchParams();
  if (category !== "") filters.set("categoria", category);
  if (disposition !== "") filters.set("revision", disposition);
  const query = filters.toString();
  const base = `/dashboard/monthly-report-management/${report.id}`;

  return (
    <div className="w-full max-w-6xl space-y-6 p-2">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">
            {periodTitle(report.month, report.year)}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {report.issuedOn === null
              ? "Documento sin emitir"
              : `Emitido el ${report.issuedOn.toLocaleDateString("es-CU")}`}
          </p>
        </div>

        <div className="flex flex-wrap items-start gap-2">
          {report.docxSha256 === null ? (
            <span className="text-muted-foreground text-sm">
              Sin documento emitido
            </span>
          ) : (
            <a
              href={`/api/reports/${report.id}/document`}
              className="bg-primary text-primary-foreground rounded-md px-4 py-2 text-sm"
            >
              Descargar informe
            </a>
          )}

          <details className="relative">
            <summary className="cursor-pointer list-none rounded-md border px-4 py-2 text-sm [&::-webkit-details-marker]:hidden">
              Regenerar
            </summary>
            <div className="bg-background absolute right-0 z-10 mt-2 w-72 rounded-lg border p-3 shadow-lg">
              <p className="text-sm">
                Regenerar vuelve a calcular el período y sobrescribe el
                documento emitido. La revisión de los hallazgos se conserva.
              </p>
              <form action={regenerateReportAction} className="mt-3">
                <input type="hidden" name="reportId" value={report.id} />
                <input type="hidden" name="year" value={report.year} />
                <input type="hidden" name="month" value={report.month} />
                <button
                  type="submit"
                  className="bg-primary text-primary-foreground w-full rounded-md px-3 py-2 text-sm"
                >
                  Regenerar de todos modos
                </button>
              </form>
            </div>
          </details>
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
            Sin nombre de usuario: {format(Number(report.unidentifiedHits))}
          </p>
        </div>

        <div className="rounded-xl border p-4">
          <p className="text-muted-foreground text-xs uppercase">
            Registros excluidos
          </p>
          {skipped === undefined ? (
            <p className="text-muted-foreground mt-1 text-sm">
              Sin desglose guardado
            </p>
          ) : (
            <ul className="mt-1 space-y-0.5 text-sm tabular-nums">
              <li>Sin respuesta: {format(skipped.unserved)}</li>
              <li>Internos: {format(skipped.internal)}</li>
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

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Hallazgos ({totalFindings})</h2>
          <p className="text-muted-foreground text-sm">
            {pendingFindings === 0
              ? "Sin hallazgos pendientes de revisión."
              : `${pendingFindings} pendientes de revisión.`}{" "}
            La revisión se conserva al regenerar.
          </p>
        </div>

        <form
          method="get"
          className="flex flex-wrap items-end gap-3 rounded-xl border p-4"
        >
          <label className="flex flex-col gap-1 text-sm">
            Categoría
            <select
              name="categoria"
              defaultValue={category}
              className="bg-background rounded-md border px-3 py-2"
            >
              <option value="">Todas</option>
              {Object.entries(CATEGORY_LABEL).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Revisión
            <select
              name="revision"
              defaultValue={disposition}
              className="bg-background rounded-md border px-3 py-2"
            >
              <option value="">Todas</option>
              {Object.entries(DISPOSITION_LABEL).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <button type="submit" className="rounded-md border px-4 py-2 text-sm">
            Filtrar
          </button>
          {query !== "" && (
            <Link
              href={base}
              className="text-muted-foreground px-2 py-2 text-sm hover:underline"
            >
              Quitar filtros
            </Link>
          )}
        </form>

        {report.findings.length === 0 ? (
          <p className="text-muted-foreground rounded-xl border border-dashed p-8 text-center text-sm">
            {totalFindings === 0
              ? "Sin coincidencias con las categorías prohibidas."
              : "Ningún hallazgo coincide con los filtros elegidos."}
          </p>
        ) : (
          <>
            <form
              id="bulk-findings"
              action={updateFindingsAction}
              className="flex flex-wrap items-end gap-3 rounded-xl border p-4"
            >
              <input type="hidden" name="reportId" value={report.id} />
              <input type="hidden" name="query" value={query} />
              <label className="flex flex-col gap-1 text-sm">
                Marcar los seleccionados como
                <select
                  name="disposition"
                  className="bg-background rounded-md border px-3 py-2"
                >
                  {Object.entries(DISPOSITION_LABEL).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="submit"
                className="rounded-md border px-4 py-2 text-sm"
              >
                Aplicar a los seleccionados
              </button>
            </form>
            <div className="overflow-x-auto rounded-xl border">
              <table className="w-full text-left text-sm">
                <caption className="sr-only">
                  Hallazgos del informe, con su revisión
                </caption>
                <thead className="bg-muted/50 text-muted-foreground text-xs uppercase">
                  <tr>
                    <th className="px-4 py-3 font-medium">
                      <span className="sr-only">Seleccionar</span>
                    </th>
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
                        <input
                          type="checkbox"
                          form="bulk-findings"
                          name="findingId"
                          value={finding.id}
                          aria-label={`Seleccionar ${finding.url}`}
                          className="size-4"
                        />
                      </td>
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
                            aria-label={`Revisión de ${finding.url}`}
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
                            aria-label={`Medida adoptada para ${finding.url}`}
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
          </>
        )}
      </section>
    </div>
  );
}
