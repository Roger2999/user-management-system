/**
 * Fechas del informe.
 *
 * Squid registra epoch en UTC (`%ts`), pero el informe es de un mes local: el
 * corte del día y del mes tiene que hacerse en la zona de la entidad. Calcular
 * el día con la zona del servidor es un error silencioso: corre un día los
 * límites y contamina la cobertura y los totales.
 */

export const DEFAULT_TIME_ZONE = "America/Havana";

const dayFormatters = new Map<string, Intl.DateTimeFormat>();

function dayFormatter(timeZone: string): Intl.DateTimeFormat {
  const cached = dayFormatters.get(timeZone);
  if (cached) return cached;

  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  dayFormatters.set(timeZone, formatter);
  return formatter;
}

/** Día local en formato `YYYY-MM-DD` para un instante UTC. */
export function toLocalDay(
  timestampMs: number,
  timeZone: string = DEFAULT_TIME_ZONE,
): string {
  const parts = dayFormatter(timeZone).formatToParts(new Date(timestampMs));
  const read = (type: string) =>
    parts.find((part) => part.type === type)?.value ?? "";

  return `${read("year")}-${read("month")}-${read("day")}`;
}

/** Cantidad de días de un mes. `month` va de 1 a 12. */
export function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

export type MonthlyPeriod = {
  year: number;
  month: number;
  /** Primer día local del período, `YYYY-MM-DD`. */
  startDay: string;
  /** Último día local del período, `YYYY-MM-DD`. */
  endDay: string;
  /** Días esperados, en orden. */
  days: string[];
};

function pad(value: number, size: number): string {
  return String(value).padStart(size, "0");
}

/**
 * Período de un mes calendario local.
 *
 * El período se declara, no se deduce de lo que se importó: un archivo que falte
 * tiene que aparecer como día faltante, no encoger el informe en silencio.
 */
export function monthlyPeriod(year: number, month: number): MonthlyPeriod {
  if (!Number.isInteger(month) || month < 1 || month > 12) {
    throw new RangeError(`mes fuera de rango: ${month}`);
  }

  const total = daysInMonth(year, month);
  const prefix = `${pad(year, 4)}-${pad(month, 2)}`;

  return {
    year,
    month,
    startDay: `${prefix}-01`,
    endDay: `${prefix}-${pad(total, 2)}`,
    days: Array.from(
      { length: total },
      (_unused, index) => `${prefix}-${pad(index + 1, 2)}`,
    ),
  };
}

export type PeriodCoverage = {
  expectedDays: number;
  presentDays: number;
  missingDays: string[];
  /** Días con datos que caen fuera del período, como el 30/04 en un informe de mayo. */
  extraDays: string[];
};

/**
 * Cobertura del período contra los días que realmente se importaron.
 *
 * `extraDays` no es informativo: es el error que traía el informe anterior, que
 * cubría 32 días porque el rango de la herramienta arrancaba el 30/04.
 */
export function checkCoverage(
  period: MonthlyPeriod,
  presentDays: Iterable<string>,
): PeriodCoverage {
  const expected = new Set(period.days);
  const present = new Set(presentDays);
  const missingDays = period.days.filter((day) => !present.has(day));
  const extraDays = [...present]
    .filter((day) => !expected.has(day))
    .sort((a, b) => a.localeCompare(b));

  return {
    expectedDays: period.days.length,
    presentDays: period.days.length - missingDays.length,
    missingDays,
    extraDays,
  };
}
