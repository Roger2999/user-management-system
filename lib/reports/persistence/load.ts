import type { PrismaClient } from "@/generated/prisma/client";
import type {
  DailyMetrics,
  DailySiteMetrics,
  DailySiteUserMetrics,
  DailyUserMetrics,
  SkippedLines,
} from "../metrics/aggregate";
import { toLocalDay, type MonthlyPeriod } from "../time";

/**
 * Reconstrucción de los días agregados desde la base de datos.
 *
 * Es la contraparte de `importSquidLogFile`: el informe no se arma desde el
 * stream, se arma desde lo que quedó guardado. Así un mes se puede regenerar sin
 * volver a leer los logs, y la importación no tiene que mantener los días en
 * memoria hasta el cierre.
 *
 * **Los hits sin cuenta se reconstruyen, no se guardan.** `DailySiteStat` suma
 * los hits y `DailyUserStat` solo los identificados; la diferencia es el tráfico
 * servido sin autenticar. Con la definición vigente (respuesta servida, S2) es 0
 * salvo que una respuesta servida no se haya autenticado.
 *
 * **Las líneas descartadas sí se guardan**, por día y por motivo, en
 * `DailySkipped`: la cobertura de S7 se regenera sin volver a importar. Una fila
 * con todo en cero también marca el día como importado, aunque no tenga hits.
 *
 * Una diferencia negativa es corrupción de datos, no un caso a tolerar: significa
 * que hay más hits de cuentas que hits totales.
 */

type DayBucket = {
  day: string;
  sites: DailySiteMetrics[];
  users: DailyUserMetrics[];
  siteUsers: DailySiteUserMetrics[];
  skipped: SkippedLines;
};

function dayOf(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function accountSortKey(username: string | null): string {
  return username ?? "\uFFFF";
}

function bucketFor(buckets: Map<string, DayBucket>, day: string): DayBucket {
  const existing = buckets.get(day);
  if (existing !== undefined) return existing;

  const created: DayBucket = {
    day,
    sites: [],
    users: [],
    siteUsers: [],
    skipped: { unserved: 0, internal: 0, telemetry: 0 },
  };
  buckets.set(day, created);
  return created;
}

/** Carga los días del período que ya fueron importados, en orden. */
export async function loadDailyMetrics(
  prisma: PrismaClient,
  period: Pick<MonthlyPeriod, "days">,
): Promise<DailyMetrics[]> {
  const dates = period.days.map((day) => new Date(`${day}T00:00:00.000Z`));

  const [siteRows, userRows, siteUserRows, skippedRows] = await Promise.all([
    prisma.dailySiteStat.findMany({ where: { date: { in: dates } } }),
    prisma.dailyUserStat.findMany({ where: { date: { in: dates } } }),
    prisma.dailySiteUserStat.findMany({ where: { date: { in: dates } } }),
    prisma.dailySkipped.findMany({ where: { date: { in: dates } } }),
  ]);

  const buckets = new Map<string, DayBucket>();

  for (const row of skippedRows) {
    const bucket = bucketFor(buckets, dayOf(row.date));
    bucket.skipped = {
      unserved: row.unserved,
      internal: row.internal,
      telemetry: row.telemetry,
    };
  }

  for (const row of siteRows) {
    bucketFor(buckets, dayOf(row.date)).sites.push({
      site: row.site,
      hits: row.hits,
      bytesIn: Number(row.bytesIn),
      bytesOut: Number(row.bytesOut),
      elapsedMs: Number(row.elapsedMs),
      browsingMs: Number(row.browsingMs),
      telemetry: row.isTelemetry,
    });
  }

  for (const row of userRows) {
    bucketFor(buckets, dayOf(row.date)).users.push({
      username: row.proxyAccountId,
      hits: row.hits,
      bytesIn: Number(row.bytesIn),
      bytesOut: Number(row.bytesOut),
      elapsedMs: Number(row.elapsedMs),
      browsingMs: Number(row.browsingMs),
    });
  }

  for (const row of siteUserRows) {
    bucketFor(buckets, dayOf(row.date)).siteUsers.push({
      site: row.site,
      username: row.proxyAccountId,
      hits: row.hits,
      bytesIn: Number(row.bytesIn),
      elapsedMs: Number(row.elapsedMs),
      browsingMs: Number(row.browsingMs),
    });
  }

  return [...buckets.values()]
    .sort((a, b) => a.day.localeCompare(b.day))
    .map((bucket) => {
      const totalHits = bucket.sites.reduce((sum, row) => sum + row.hits, 0);
      const identifiedHits = bucket.users.reduce((sum, row) => sum + row.hits, 0);
      const unidentifiedHits = totalHits - identifiedHits;

      if (unidentifiedHits < 0) {
        throw new RangeError(
          `datos inconsistentes en ${bucket.day}: ${identifiedHits} hits de cuentas contra ${totalHits} hits totales`,
        );
      }

      return {
        day: bucket.day,
        totalHits,
        totalBytesIn: bucket.sites.reduce((sum, row) => sum + row.bytesIn, 0),
        totalBytesOut: bucket.sites.reduce((sum, row) => sum + row.bytesOut, 0),
        totalElapsedMs: bucket.sites.reduce((sum, row) => sum + row.elapsedMs, 0),
        unidentifiedHits,
        skipped: bucket.skipped,
        users: bucket.users.sort(
          (a, b) =>
            b.hits - a.hits ||
            accountSortKey(a.username).localeCompare(accountSortKey(b.username)),
        ),
        sites: bucket.sites.sort(
          (a, b) => b.hits - a.hits || a.site.localeCompare(b.site),
        ),
        siteUsers: bucket.siteUsers.sort(
          (a, b) =>
            a.site.localeCompare(b.site) ||
            b.hits - a.hits ||
            accountSortKey(a.username).localeCompare(accountSortKey(b.username)),
        ),
      };
    });
}

/**
 * Días del período que ya tienen datos cargados.
 *
 * `DailySkipped` deja una fila por día importado aunque todos sus contadores
 * estén en cero, así que es la marca de "día cargado": es la misma fuente que
 * usa `loadDailyMetrics` para crear sus cubos. Sirve para mostrar la cobertura
 * antes de generar, cuando todavía no hay informe.
 */
export async function listImportedDays(
  prisma: PrismaClient,
  period: Pick<MonthlyPeriod, "days">,
): Promise<string[]> {
  const dates = period.days.map((day) => new Date(`${day}T00:00:00.000Z`));

  const rows = await prisma.dailySkipped.findMany({
    where: { date: { in: dates } },
    select: { date: true },
    orderBy: { date: "asc" },
  });

  return rows.map((row) => dayOf(row.date));
}

export type PeriodFileRow = {
  id: string;
  fileName: string;
  linesTotal: number;
  importedAt: Date;
  /** Días locales del período a los que aporta el archivo. */
  days: string[];
};

/** Techo de días que se expanden por archivo, para un archivo atípico enorme. */
const MAX_SPAN_DAYS = 400;

function daysBetween(firstDay: string, lastDay: string): string[] {
  const days: string[] = [];
  const cursor = new Date(`${firstDay}T00:00:00.000Z`);
  const end = new Date(`${lastDay}T00:00:00.000Z`).getTime();

  for (let index = 0; index < MAX_SPAN_DAYS; index += 1) {
    days.push(cursor.toISOString().slice(0, 10));
    if (cursor.getTime() >= end) break;
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return days;
}

/**
 * Archivos cargados que aportan al período.
 *
 * `ImportedLogFile` no guarda a qué días aportó cada archivo, así que se deduce
 * de su primer y último evento en la zona local. Un archivo diario toca dos días
 * locales como máximo (el de su medianoche UTC y el siguiente en La Habana). La
 * ventana UTC se abre un día a cada lado para no perder los archivos que caen
 * justo sobre el borde del mes.
 */
export async function listPeriodFiles(
  prisma: PrismaClient,
  period: Pick<MonthlyPeriod, "days">,
): Promise<PeriodFileRow[]> {
  const first = period.days[0];
  const last = period.days[period.days.length - 1];
  if (first === undefined || last === undefined) return [];

  const from = new Date(`${first}T00:00:00.000Z`);
  from.setUTCDate(from.getUTCDate() - 1);
  const to = new Date(`${last}T23:59:59.999Z`);
  to.setUTCDate(to.getUTCDate() + 1);

  const rows = await prisma.importedLogFile.findMany({
    where: { firstEventAt: { lte: to }, lastEventAt: { gte: from } },
    orderBy: { importedAt: "desc" },
    select: {
      id: true,
      fileName: true,
      linesTotal: true,
      importedAt: true,
      firstEventAt: true,
      lastEventAt: true,
    },
  });

  const expected = new Set(period.days);

  return rows
    .map((row) => {
      const days = daysBetween(
        toLocalDay(row.firstEventAt.getTime()),
        toLocalDay(row.lastEventAt.getTime()),
      ).filter((day) => expected.has(day));

      return {
        id: row.id,
        fileName: row.fileName,
        linesTotal: row.linesTotal,
        importedAt: row.importedAt,
        days,
      };
    })
    .filter((row) => row.days.length > 0);
}
