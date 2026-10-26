"use client";

import { useActionState } from "react";
import { MONTHS } from "@/lib/reports/document/period";
import { generateReportAction, type GenerateReportState } from "../actions";

const INITIAL: GenerateReportState = {};

export default function GenerateForm({
  defaultYear,
  defaultMonth,
}: {
  defaultYear: number;
  defaultMonth: number;
}) {
  const [state, action, pending] = useActionState(
    generateReportAction,
    INITIAL,
  );

  return (
    <section className="rounded-xl border p-5">
      <h2 className="text-lg font-semibold">Generar el informe</h2>
      <p className="text-muted-foreground mt-1 text-sm">
        Reconstruye el mes desde la base, emite el <code>.docx</code> oficial y
        detecta los hallazgos de las reglas activas. No vuelve a leer los logs.
      </p>

      <form action={action} className="mt-4 flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-sm">
          Año
          <input
            type="number"
            name="year"
            min={2000}
            max={2100}
            defaultValue={defaultYear}
            className="bg-background w-28 rounded-md border px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Mes
          <select
            name="month"
            defaultValue={defaultMonth}
            className="bg-background rounded-md border px-3 py-2 capitalize"
          >
            {MONTHS.map((name, index) => (
              <option key={name} value={index + 1} className="capitalize">
                {name}
              </option>
            ))}
          </select>
        </label>
        <button
          type="submit"
          disabled={pending}
          className="bg-primary text-primary-foreground rounded-md px-4 py-2 text-sm disabled:opacity-50"
        >
          {pending ? "Generando…" : "Generar informe"}
        </button>
      </form>

      {state.error !== undefined && (
        <p className="text-destructive mt-4 text-sm">{state.error}</p>
      )}
    </section>
  );
}
