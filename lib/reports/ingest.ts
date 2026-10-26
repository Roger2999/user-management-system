/**
 * Ingesta de un archivo diario de Squid.
 *
 * El parser entrega registros con epoch UTC; el informe es de días locales. Un
 * archivo puede traer registros de dos días locales —el export de mayo incluye
 * el 30/04—, así que cada registro se enruta a su acumulador por día local en
 * lugar de asumir que el archivo entero es del día que dice el nombre.
 *
 * Un día fuera del período no se suma: se cuenta y se declara (S19). Sumarlo
 * correría los totales del mes sin que nadie lo note.
 *
 * Esta función es pura respecto de la persistencia: no calcula hashes ni guarda
 * nada. La idempotencia y el registro en base de datos son de la capa que la
 * llama.
 */

import { DailyMetricsAccumulator, type DailyMetrics, type DailyMetricsOptions } from "./metrics/aggregate";
import {
  parseSquidLogStream,
  type SquidLogColumn,
} from "./parser/squid-log";
import { DEFAULT_TIME_ZONE, toLocalDay, type MonthlyPeriod } from "./time";
import type { ParseStats } from "./types";

export type IngestSquidLogOptions = {
  /** Período del informe: define qué días locales se acumulan. */
  period: Pick<MonthlyPeriod, "days">;
  timeZone?: string;
  columns?: readonly SquidLogColumn[];
  metrics?: DailyMetricsOptions;
};

export type OutsidePeriodDay = {
  /** Día local, `YYYY-MM-DD`. */
  day: string;
  /** Hits de ese día que no se sumaron al informe. */
  hits: number;
};

export type IngestSquidLogResult = {
  /** Métricas de los días del período presentes en el archivo, en orden. */
  days: DailyMetrics[];
  /** Días locales fuera del período que traía el archivo. */
  outsidePeriod: OutsidePeriodDay[];
  stats: ParseStats;
  /**
   * Instante UTC del primer y último registro válido del archivo, o `null` si no
   * hubo ninguno. `ImportedLogFile` los exige, y no se pueden deducir de las
   * métricas: un archivo puede traer días ajenos al período que igual son parte
   * de su contenido.
   */
  firstEventAt: number | null;
  lastEventAt: number | null;
};

/** Acumula un `access.log` completo en métricas por día local. */
export async function ingestSquidLog(
  input: NodeJS.ReadableStream,
  options: IngestSquidLogOptions,
): Promise<IngestSquidLogResult> {
  const timeZone = options.timeZone ?? DEFAULT_TIME_ZONE;
  const expected = new Set(options.period.days);
  const accumulators = new Map<string, DailyMetricsAccumulator>();
  const outside = new Map<string, number>();
  let firstEventAt: number | null = null;
  let lastEventAt: number | null = null;

  const stats = await parseSquidLogStream(input, {
    columns: options.columns,
    onRecord: (record) => {
      if (firstEventAt === null || record.timestampMs < firstEventAt) {
        firstEventAt = record.timestampMs;
      }
      if (lastEventAt === null || record.timestampMs > lastEventAt) {
        lastEventAt = record.timestampMs;
      }

      const day = toLocalDay(record.timestampMs, timeZone);

      if (!expected.has(day)) {
        outside.set(day, (outside.get(day) ?? 0) + 1);
        return;
      }

      let accumulator = accumulators.get(day);
      if (accumulator === undefined) {
        accumulator = new DailyMetricsAccumulator(day, options.metrics);
        accumulators.set(day, accumulator);
      }

      accumulator.add(record);
    },
  });

  return {
    days: [...accumulators.values()]
      .map((accumulator) => accumulator.toMetrics())
      .sort((a, b) => a.day.localeCompare(b.day)),
    outsidePeriod: [...outside.entries()]
      .map(([day, hits]) => ({ day, hits }))
      .sort((a, b) => a.day.localeCompare(b.day)),
    stats,
    firstEventAt,
    lastEventAt,
  };
}
