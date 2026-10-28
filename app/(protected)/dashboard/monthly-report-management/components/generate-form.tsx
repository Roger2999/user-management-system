"use client";

import { useActionState } from "react";
import type { PeriodCoverage } from "@/lib/reports/time";
import { generateReportAction, type GenerateReportState } from "../actions";

const INITIAL: GenerateReportState = {};

export default function GenerateForm({
  year,
  month,
  coverage,
}: {
  year: number;
  month: number;
  coverage: PeriodCoverage | null;
}) {
  const [state, action, pending] = useActionState(
    generateReportAction,
    INITIAL,
  );

  const missing = coverage?.missingDays.length ?? 0;
  const empty = coverage !== null && coverage.presentDays === 0;

  return (
    <section className="rounded-xl border p-5">
      <h2 className="text-lg font-semibold">Generar el informe</h2>
      <p className="text-muted-foreground mt-1 text-sm">
        Genera el informe del período con los logs cargados actualmente y señala
        las coincidencias con las categorías prohibidas.
      </p>

      <form action={action} className="mt-4 flex flex-wrap items-end gap-3">
        <input type="hidden" name="year" value={year} />
        <input type="hidden" name="month" value={month} />
        <button
          type="submit"
          disabled={pending || empty}
          className="bg-primary text-primary-foreground rounded-md px-4 py-2 text-sm disabled:opacity-50"
        >
          {pending ? "Generando…" : "Generar informe"}
        </button>
      </form>

      {empty && (
        <p className="text-muted-foreground mt-4 text-sm">
          Todavía no hay días cargados en este período. Importa los logs antes
          de generar.
        </p>
      )}

      {!empty && missing > 0 && (
        <p className="text-muted-foreground mt-4 text-sm">
          {missing === 1
            ? "Falta 1 día del período."
            : `Faltan ${missing} días del período.`}{" "}
          El informe va a generarse incompleto.
        </p>
      )}

      {state.error !== undefined && (
        <p className="text-destructive mt-4 text-sm">{state.error}</p>
      )}
    </section>
  );
}
