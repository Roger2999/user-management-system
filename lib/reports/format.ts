/**
 * Contrato de formato del informe.
 *
 * El informe mensual es un documento oficial: los números que emite el sistema
 * tienen que ser idénticos a los de las tablas que hoy se exportan de WebSpy
 * Giga Analyzer y se pegan en Word. Por eso todo formateo pasa por acá y por
 * ningún otro lado.
 *
 * Formato de referencia tomado de `IM EE Matanzas mayo 2026.docx`:
 *   enteros         129,351
 *   megabytes       3,676.86
 *   duración        699:52:18   (sin tope de 24 horas)
 *   porcentaje      0.1%        (siempre un decimal, 0.0% incluido)
 */

const INTEGER_FORMAT = new Intl.NumberFormat("en-US", {
  useGrouping: true,
  maximumFractionDigits: 0,
});

const MEGABYTE_FORMAT = new Intl.NumberFormat("en-US", {
  useGrouping: true,
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const BYTES_PER_MEGABYTE = 1024 * 1024;

/** `129351` → `"129,351"`. */
export function formatInteger(value: number): string {
  if (!Number.isFinite(value)) return "0";
  return INTEGER_FORMAT.format(Math.trunc(value));
}

/** `1048576` → `"1.00"`. */
export function formatMegabytes(bytes: number): string {
  if (!Number.isFinite(bytes)) return MEGABYTE_FORMAT.format(0);
  return MEGABYTE_FORMAT.format(bytes / BYTES_PER_MEGABYTE);
}

/**
 * Milisegundos a `h:m:s` sin tope de 24 horas.
 *
 * El tope no aplica porque el informe acumula tiempo de sesiones de un mes
 * entero: `699:52:18` es un valor válido y aparece en el documento vigente.
 */
export function formatDuration(ms: number): string {
  if (!Number.isFinite(ms) || ms < 0) return "00:00:00";

  const totalSeconds = Math.round(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return [hours, minutes, seconds]
    .map((part) => String(part).padStart(2, "0"))
    .join(":");
}

/** Porcentaje con un decimal. Un total no positivo da `"0.0%"`. */
export function formatPercentage(part: number, total: number): string {
  if (!Number.isFinite(part) || !Number.isFinite(total) || total <= 0) {
    return "0.0%";
  }

  return `${((part / total) * 100).toFixed(1)}%`;
}
