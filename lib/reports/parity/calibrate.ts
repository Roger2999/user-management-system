import { DailyMetricsAccumulator } from "../metrics/aggregate";
import { toLocalDay, DEFAULT_TIME_ZONE } from "../time";
import type { SquidLogRecord } from "../types";

/**
 * Calibración del `Browsing Time` por par (sitio, usuario).
 *
 * WebSpy no documenta cómo calcula el tiempo de navegación: es un valor
 * derivado, no un campo del log. La única forma honesta de averiguarlo es
 * probar umbrales y quedarse con el que reproduce los tiempos publicados.
 *
 * El umbral no siempre queda identificado con precisión: si en la muestra no
 * hay huecos entre dos valores candidatos, varios umbrales dan el mismo
 * resultado. Por eso la función devuelve todos los candidatos con su error y no
 * un único "ganador". El llamador decide si el rango alcanza.
 */
export type CalibrationTarget = {
  site: string;
  username: string;
  browsingMs: number;
};

export type CalibrationCandidate = {
  gapMs: number;
  /** Pares (sitio, usuario) que coinciden al milisegundo con el objetivo. */
  exactPairs: number;
  /** Pares evaluados: los objetivos más los que el motor calcula y no estaban. */
  pairs: number;
  /** Suma de diferencias absolutas, en milisegundos. Cero es reproducción exacta. */
  errorMs: number;
};

export type CalibrationOptions = {
  timeZone?: string;
  uploadMethods?: readonly string[];
};

const DEFAULT_CANDIDATES_MS = [
  5, 10, 15, 20, 25, 30, 35, 40, 45, 60, 90, 120,
].map((minutes) => minutes * 60 * 1000);

/**
 * Umbrales candidatos por defecto.
 *
 * El de 5 minutos es el default documentado de WebSpy (`Tools | Options |
 * General`, `Session Threshold`) y el punto de partida: la calibración lo
 * confirma o encuentra el valor real con error cero.
 */
export function defaultGapCandidates(): number[] {
  return [...DEFAULT_CANDIDATES_MS];
}

function pairKey(site: string, username: string): string {
  return `${site}\u0000${username}`;
}

/** Acumula por par (sitio, usuario) sumando los días locales del período. */
function accumulatePairs(
  records: readonly SquidLogRecord[],
  gapMs: number,
  options: CalibrationOptions,
): Map<string, number> {
  const timeZone = options.timeZone ?? DEFAULT_TIME_ZONE;
  const byDay = new Map<string, SquidLogRecord[]>();

  for (const record of records) {
    const day = toLocalDay(record.timestampMs, timeZone);
    const bucket = byDay.get(day);
    if (bucket === undefined) byDay.set(day, [record]);
    else bucket.push(record);
  }

  const totals = new Map<string, number>();

  for (const [day, bucket] of byDay) {
    bucket.sort((a, b) => a.timestampMs - b.timestampMs);
    const accumulator = new DailyMetricsAccumulator(day, {
      browsingGapMs: gapMs,
      uploadMethods: options.uploadMethods,
    });

    for (const record of bucket) accumulator.add(record);

    for (const pair of accumulator.toMetrics().siteUsers) {
      if (pair.username === null) continue;
      const key = pairKey(pair.site, pair.username);
      totals.set(key, (totals.get(key) ?? 0) + pair.browsingMs);
    }
  }

  return totals;
}

export function calibrateBrowsingGap(
  records: readonly SquidLogRecord[],
  targets: readonly CalibrationTarget[],
  candidatesMs: readonly number[] = DEFAULT_CANDIDATES_MS,
  options: CalibrationOptions = {},
): CalibrationCandidate[] {
  const expected = new Map<string, number>();
  for (const target of targets) {
    expected.set(pairKey(target.site, target.username), target.browsingMs);
  }

  const results = candidatesMs.map((gapMs) => {
    const actual = accumulatePairs(records, gapMs, options);
    let exactPairs = 0;
    let errorMs = 0;
    const keys = new Set([...expected.keys(), ...actual.keys()]);

    for (const key of keys) {
      const target = expected.get(key) ?? 0;
      const computed = actual.get(key) ?? 0;
      if (target === computed) exactPairs += 1;
      errorMs += Math.abs(target - computed);
    }

    return {
      gapMs,
      exactPairs,
      pairs: keys.size,
      errorMs,
    };
  });

  return results.sort((a, b) => a.errorMs - b.errorMs || b.exactPairs - a.exactPairs);
}

/** Candidatos que reproducen todos los objetivos sin error. */
export function exactCandidates(
  results: readonly CalibrationCandidate[],
): CalibrationCandidate[] {
  return results.filter((result) => result.errorMs === 0);
}
