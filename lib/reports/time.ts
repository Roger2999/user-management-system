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
