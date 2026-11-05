import type { PeriodCoverage } from "./time";

/**
 * Texto de cobertura para la pantalla de preparación y para el detalle.
 *
 * Vive aparte de `checkCoverage` porque el cálculo y su redacción se prueban
 * por separado: el motor decide qué días faltan, esta función decide cómo se
 * le cuenta a una persona.
 */
export type CoverageSummary = {
  /** `30 de 31 días cargados` */
  headline: string;
  /** `Falta el día 31.` | `Cobertura completa.` */
  detail: string;
  /** Días ajenos al período, o `null` si no hay. */
  extra: string | null;
  complete: boolean;
};

function dayOfMonth(day: string): string {
  return String(Number(day.slice(8, 10)));
}

function joinSpanish(items: readonly string[]): string {
  if (items.length === 1) return items[0] as string;
  return `${items.slice(0, -1).join(", ")} y ${items[items.length - 1] as string}`;
}

/**
 * Comprime días consecutivos en rangos: `1, 2, 3, 7` → `1–3 y 7`.
 *
 * Un mes con trece días faltantes se lee de un tirón; la lista completa era el
 * 90% del texto del panel y no ayudaba a decidir nada.
 */
function compactDays(days: readonly string[]): string {
  const numbers = [...new Set(days.map(dayOfMonth).map(Number))].sort(
    (a, b) => a - b,
  );

  const groups: string[] = [];
  let start = numbers[0];
  let previous = numbers[0];

  for (const number of numbers.slice(1)) {
    if (previous !== undefined && number === previous + 1) {
      previous = number;
      continue;
    }

    groups.push(
      start === previous || start === undefined
        ? String(start)
        : `${start}–${previous}`,
    );
    start = number;
    previous = number;
  }

  if (start !== undefined) {
    groups.push(
      start === previous ? String(start) : `${start}–${previous}`,
    );
  }

  return joinSpanish(groups);
}


export function coverageSummary(coverage: PeriodCoverage): CoverageSummary {
  const { presentDays, expectedDays, missingDays, extraDays } = coverage;
  const complete = missingDays.length === 0;

  const headline =
    expectedDays === 1
      ? `${presentDays} de 1 día cargado`
      : `${presentDays} de ${expectedDays} días cargados`;

  let detail = "Cobertura completa.";
  if (!complete && missingDays.length === 1) {
    detail = `Falta el día ${dayOfMonth(missingDays[0] as string)}.`;
  } else if (!complete) {
    detail = `Faltan los días ${compactDays(missingDays)}.`;
  }

  const extra =
    extraDays.length === 0
      ? null
      : `Fuera del período (no se suman): ${extraDays.join(", ")}.`;

  return { headline, detail, extra, complete };
}
