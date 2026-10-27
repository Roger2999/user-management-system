"use client";

import { useCallback, useRef, useState } from "react";
import { coverageSummary } from "@/lib/reports/coverage-text";
import { MONTHS } from "@/lib/reports/document/period";
import type { PeriodCoverage } from "@/lib/reports/time";
import { reportCoverageAction } from "../actions";
import GenerateForm from "./generate-form";
import ImportForm from "./import-form";

/**
 * Preparación del mes: un solo período para las dos etapas y la cobertura a la
 * vista antes de generar.
 *
 * El período vive acá, no en cada formulario, para que no pueda importarse un
 * mes y generar otro. La cobertura inicial llega calculada del servidor y se
 * vuelve a pedir al cambiar el período o al terminar una importación.
 */
export default function PrepareMonth({
  defaultYear,
  defaultMonth,
  initialCoverage,
}: {
  defaultYear: number;
  defaultMonth: number;
  initialCoverage: PeriodCoverage;
}) {
  const [year, setYear] = useState(defaultYear);
  const [month, setMonth] = useState(defaultMonth);
  const [coverage, setCoverage] = useState<PeriodCoverage>(initialCoverage);
  const [loadingCoverage, setLoadingCoverage] = useState(false);
  const [busy, setBusy] = useState(false);
  const requestId = useRef(0);

  const refreshCoverage = useCallback(
    async (nextYear: number, nextMonth: number) => {
      if (!Number.isInteger(nextYear) || !Number.isInteger(nextMonth)) return;

      const current = requestId.current + 1;
      requestId.current = current;
      setLoadingCoverage(true);

      try {
        const next = await reportCoverageAction(nextYear, nextMonth);
        // Una respuesta vieja no puede pisar a la del período actual.
        if (next !== null && requestId.current === current) setCoverage(next);
      } finally {
        if (requestId.current === current) setLoadingCoverage(false);
      }
    },
    [],
  );

  function changeMonth(value: number): void {
    setMonth(value);
    void refreshCoverage(year, value);
  }

  function changeYear(value: number): void {
    setYear(value);
    void refreshCoverage(value, month);
  }

  const summary = coverageSummary(coverage);
  const monthName = MONTHS[month - 1] ?? "";
  const monthTitle = `${monthName.charAt(0).toUpperCase()}${monthName.slice(1)}`;

  return (
    <div className="w-full max-w-4xl space-y-6 p-2">
      <header>
        <h1 className="text-2xl font-semibold">
          Preparar el informe de {monthTitle}
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Elegí el período, cargá los registros de cada día y generá el
          documento cuando el mes esté completo.
        </p>
      </header>

      <section className="rounded-xl border p-5">
        <h2 className="text-lg font-semibold">Período del informe</h2>

        <div className="mt-4 flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1 text-sm">
            Mes
            <select
              value={month}
              onChange={(event) => changeMonth(Number(event.target.value))}
              disabled={busy}
              className="bg-background rounded-md border px-3 py-2 capitalize disabled:opacity-50"
            >
              {MONTHS.map((name, index) => (
                <option key={name} value={index + 1} className="capitalize">
                  {name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Año
            <input
              type="number"
              min={2000}
              max={2100}
              value={year}
              onChange={(event) => changeYear(Number(event.target.value))}
              disabled={busy}
              className="bg-background w-28 rounded-md border px-3 py-2 disabled:opacity-50"
            />
          </label>
        </div>

        <div
          aria-live="polite"
          className="mt-4 rounded-lg border border-dashed px-4 py-3"
        >
          <p className="text-sm font-medium">{summary.headline}</p>
          <p className="text-muted-foreground text-sm">
            {loadingCoverage ? "Actualizando la cobertura…" : summary.detail}
          </p>
          {summary.extra !== null && (
            <p className="text-muted-foreground mt-1 text-xs">{summary.extra}</p>
          )}
        </div>
      </section>

      <ImportForm
        year={year}
        month={month}
        onBusyChange={setBusy}
        onFinished={() => void refreshCoverage(year, month)}
      />

      <GenerateForm year={year} month={month} coverage={coverage} />
    </div>
  );
}
