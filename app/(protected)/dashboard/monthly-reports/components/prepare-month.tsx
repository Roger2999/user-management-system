"use client";

import { useCallback, useRef, useState } from "react";
import { coverageSummary } from "@/lib/reports/coverage-text";
import { MONTHS } from "@/lib/reports/document/period";
import type { PeriodFileRow } from "@/lib/reports/persistence/load";
import { DEFAULT_TIME_ZONE, type PeriodCoverage } from "@/lib/reports/time";
import { reportPeriodStateAction } from "../actions";
import GenerateForm from "./generate-form";
import ImportForm from "./import-form";

type PeriodState = { coverage: PeriodCoverage; files: PeriodFileRow[] };

function format(value: number): string {
  return value.toLocaleString("es-CU");
}

/**
 * Preparación del mes: un solo período para las dos etapas, la cobertura y los
 * archivos cargados a la vista antes de generar.
 *
 * El período vive acá, no en cada formulario, para que no pueda importarse un
 * mes y generar otro. El estado inicial llega calculado del servidor y se vuelve
 * a pedir al cambiar el período o al terminar una importación.
 */
export default function PrepareMonth({
  defaultYear,
  defaultMonth,
  initialState,
}: {
  defaultYear: number;
  defaultMonth: number;
  initialState: PeriodState;
}) {
  const [year, setYear] = useState(defaultYear);
  const [month, setMonth] = useState(defaultMonth);
  const [state, setState] = useState<PeriodState>(initialState);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const requestId = useRef(0);

  const refresh = useCallback(async (nextYear: number, nextMonth: number) => {
    if (!Number.isInteger(nextYear) || !Number.isInteger(nextMonth)) return;

    const current = requestId.current + 1;
    requestId.current = current;
    setLoading(true);

    try {
      const next = await reportPeriodStateAction(nextYear, nextMonth);
      // Una respuesta vieja no puede pisar a la del período actual.
      if (next !== null && requestId.current === current) setState(next);
    } finally {
      if (requestId.current === current) setLoading(false);
    }
  }, []);

  function changeMonth(value: number): void {
    setMonth(value);
    void refresh(year, value);
  }

  function changeYear(value: number): void {
    setYear(value);
    void refresh(value, month);
  }

  const summary = coverageSummary(state.coverage);
  const files = state.files;
  const monthName = MONTHS[month - 1] ?? "";
  const monthTitle = `${monthName.charAt(0).toUpperCase()}${monthName.slice(1)}`;

  return (
    <div className="w-full max-w-4xl space-y-6 p-2">
      <header>
        <h1 className="text-2xl font-semibold">
          Preparar el informe de {monthTitle}
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Elige el período, importa los logs de cada día y genera el documento
          cuando el mes esté completo.
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
            {loading ? "Actualizando…" : summary.detail}
          </p>
          {summary.extra !== null && (
            <p className="text-muted-foreground mt-1 text-xs">
              {summary.extra}
            </p>
          )}
        </div>

        <h3 className="mt-5 text-sm font-semibold">
          Archivos cargados ({files.length})
        </h3>

        {files.length === 0 ? (
          <p className="text-muted-foreground mt-1 text-sm">
            Todavía no hay archivos cargados en este período.
          </p>
        ) : (
          <ul className="mt-2 max-h-56 space-y-1 overflow-auto text-sm">
            {files.map((file) => (
              <li
                key={file.id}
                className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 rounded border px-3 py-2"
              >
                <span className="font-medium break-all">{file.fileName}</span>
                <span className="text-muted-foreground text-xs tabular-nums">
                  {format(file.linesTotal)} líneas · {file.days.join(", ")} ·{" "}
                  {file.importedAt.toLocaleDateString("es-CU", {
                    timeZone: DEFAULT_TIME_ZONE,
                  })}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <ImportForm
        year={year}
        month={month}
        onBusyChange={setBusy}
        onFinished={() => void refresh(year, month)}
      />

      <GenerateForm year={year} month={month} coverage={state.coverage} />
    </div>
  );
}
