import type { PrismaClient } from "@/generated/prisma/client";
import type {
  DailyMetrics,
  DailySiteMetrics,
  DailySiteUserMetrics,
  DailyUserMetrics,
} from "../metrics/aggregate";
import type { MonthlyPeriod } from "../time";

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
 * salvo que una respuesta servida no se haya autenticado. Las líneas descartadas
 * (retos, denegaciones, destinos internos) no se persisten todavía: la cobertura
 * las declara al importar (S7).
 *
 * Una diferencia negativa es corrupción de datos, no un caso a tolerar: significa
 * que hay más hits de cuentas que hits totales.
 */

type DayBucket = {
  day: string;
  sites: DailySiteMetrics[];
  users: DailyUserMetrics[];
  siteUsers: DailySiteUserMetrics[];
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

  const created: DayBucket = { day, sites: [], users: [], siteUsers: [] };
  buckets.set(day, created);
  return created;
}

/** Carga los días del período que ya fueron importados, en orden. */
export async function loadDailyMetrics(
  prisma: PrismaClient,
  period: Pick<MonthlyPeriod, "days">,
): Promise<DailyMetrics[]> {
  const dates = period.days.map((day) => new Date(`${day}T00:00:00.000Z`));

  const [siteRows, userRows, siteUserRows] = await Promise.all([
    prisma.dailySiteStat.findMany({ where: { date: { in: dates } } }),
    prisma.dailyUserStat.findMany({ where: { date: { in: dates } } }),
    prisma.dailySiteUserStat.findMany({ where: { date: { in: dates } } }),
  ]);

  const buckets = new Map<string, DayBucket>();

  for (const row of siteRows) {
    bucketFor(buckets, dayOf(row.date)).sites.push({
      site: row.site,
      hits: row.hits,
      bytesIn: Number(row.bytesIn),
      bytesOut: Number(row.bytesOut),
      elapsedMs: Number(row.elapsedMs),
      browsingMs: Number(row.browsingMs),
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
