import type { SiteSelection, SiteTotals, SiteUserTotals, TracesSection, UserTotals } from "../assembly/section-traces";
import { buildTracesSection } from "../assembly/section-traces";
import type { DailyMetrics } from "../metrics/aggregate";
import { checkCoverage, monthlyPeriod } from "../time";
import type { MonthlyPeriod, PeriodCoverage } from "../time";

/**
 * Modelo del informe mensual: de los días agregados al informe que se aprueba.
 *
 * Tres decisiones que están acá porque son las que sostienen el documento:
 *
 * - **El período se declara, no se deduce.** `monthlyPeriod` fija el mes
 *   calendario local; un día que falta se reporta como faltante y un día ajeno
 *   (el 30/04 en un informe de mayo) se reporta como ajeno en vez de sumarse.
 * - **La selección de sitios es un dato del informe.** El motor puede proponer
 *   un top por hits, pero lo que se emite es la lista que el especialista
 *   confirma. Ver S20.
 * - **Un día se agrega una sola vez.** Reimportar el mismo archivo no puede
 *   duplicar métricas: el merge rechaza días repetidos en vez de sumarlos dos
 *   veces.
 *
 * El `Browsing Time` de cada día se suma tal cual. La sesión que cruza la
 * medianoche local se corta en el cambio de día: es una aproximación conocida y
 * por eso el informe la declara (S12).
 */

export type MonthlyTotals = {
  totalHits: number;
  totalBytesIn: number;
  totalBytesOut: number;
  totalElapsedMs: number;
  /** Hits sin cuenta de proxy autenticada. Se declara en la cobertura (S7). */
  unidentifiedHits: number;
  users: UserTotals[];
  sites: SiteTotals[];
  siteUsers: SiteUserTotals[];
};

export type MonthlyCoverage = PeriodCoverage & {
  /** Días que el informe declara como faltantes. */
  missingDays: string[];
  unidentifiedHits: number;
};

export type MonthlyReport = {
  period: MonthlyPeriod;
  coverage: MonthlyCoverage;
  totals: MonthlyTotals;
  traces: TracesSection;
  declarations: {
    /** `Browsing Time` es una aproximación hasta calibrar los dos relojes (S12). */
    browsingTimeApproximate: boolean;
    /** Hay días faltantes: el informe no puede aprobarse sin declararlo (S7). */
    incompleteCoverage: boolean;
  };
};

const UNIDENTIFIED_KEY = "\u0000";

function userKey(username: string | null): string {
  return username ?? UNIDENTIFIED_KEY;
}

function pairKey(site: string, username: string | null): string {
  return `${site}\u0001${userKey(username)}`;
}

function accountSortKey(username: string | null): string {
  return username ?? "\uFFFF";
}

/**
 * Suma los días ya agregados.
 *
 * No vuelve a leer el log ni recalcula relojes: los tiempos de navegación se
 * acumularon por día y acá solo se suman. Recibir el mismo día dos veces es un
 * error de importación, no una entrada repetida del log.
 */
export function mergeDailyMetrics(
  days: readonly DailyMetrics[],
): MonthlyTotals {
  const seenDays = new Set<string>();
  const users = new Map<string, UserTotals>();
  const sites = new Map<string, SiteTotals>();
  const siteUsers = new Map<string, SiteUserTotals>();

  let totalHits = 0;
  let totalBytesIn = 0;
  let totalBytesOut = 0;
  let totalElapsedMs = 0;
  let unidentifiedHits = 0;

  for (const day of days) {
    if (seenDays.has(day.day)) {
      throw new RangeError(`día importado dos veces: ${day.day}`);
    }
    seenDays.add(day.day);

    totalHits += day.totalHits;
    totalBytesIn += day.totalBytesIn;
    totalBytesOut += day.totalBytesOut;
    totalElapsedMs += day.totalElapsedMs;
    unidentifiedHits += day.unidentifiedHits;

    for (const row of day.users) {
      const key = userKey(row.username);
      const current = users.get(key);
      if (current === undefined) {
        users.set(key, { ...row });
        continue;
      }

      current.hits += row.hits;
      current.bytesIn += row.bytesIn;
      current.bytesOut += row.bytesOut;
      current.elapsedMs += row.elapsedMs;
      current.browsingMs += row.browsingMs;
    }

    for (const row of day.sites) {
      const current = sites.get(row.site);
      if (current === undefined) {
        sites.set(row.site, { ...row });
        continue;
      }

      current.hits += row.hits;
      current.bytesIn += row.bytesIn;
      current.bytesOut += row.bytesOut;
      current.elapsedMs += row.elapsedMs;
      current.browsingMs += row.browsingMs;
    }

    for (const row of day.siteUsers) {
      const key = pairKey(row.site, row.username);
      const current = siteUsers.get(key);
      if (current === undefined) {
        siteUsers.set(key, { ...row });
        continue;
      }

      current.hits += row.hits;
      current.bytesIn += row.bytesIn;
      current.elapsedMs += row.elapsedMs;
      current.browsingMs += row.browsingMs;
    }
  }

  return {
    totalHits,
    totalBytesIn,
    totalBytesOut,
    totalElapsedMs,
    unidentifiedHits,
    users: [...users.values()].sort(
      (a, b) =>
        b.browsingMs - a.browsingMs ||
        b.hits - a.hits ||
        accountSortKey(a.username).localeCompare(accountSortKey(b.username)),
    ),
    sites: [...sites.values()].sort(
      (a, b) => b.hits - a.hits || a.site.localeCompare(b.site),
    ),
    siteUsers: [...siteUsers.values()].sort(
      (a, b) =>
        a.site.localeCompare(b.site) ||
        b.browsingMs - a.browsingMs ||
        accountSortKey(a.username).localeCompare(accountSortKey(b.username)),
    ),
  };
}

export type MonthlyReportInput = {
  year: number;
  month: number;
  daily: readonly DailyMetrics[];
  selection: SiteSelection;
  nationalExclusions?: readonly string[];
  /** Recorte de filas al renderizar. No afecta el merge ni los denominadores. */
  limit?: number;
  /**
   * Si los dos relojes de `Browsing Time` ya se calibraron contra WebSpy.
   * Mientras sea falso, el informe declara la aproximación (S12).
   */
  browsingTimeCalibrated?: boolean;
};

/**
 * Arma el informe del mes.
 *
 * Los días ajenos al período se declaran en la cobertura y **no** entran en la
 * suma: sumar el 30/04 en un informe de mayo reproduce el error de rango de la
 * herramienta anterior, no el mes que se informa (S19).
 */
export function buildMonthlyReport(input: MonthlyReportInput): MonthlyReport {
  const period = monthlyPeriod(input.year, input.month);
  const periodDays = new Set(period.days);
  const presentDays = input.daily.map((day) => day.day);
  const includedDays = input.daily.filter((day) => periodDays.has(day.day));

  const totals = mergeDailyMetrics(includedDays);
  const coverage = checkCoverage(period, presentDays);

  const traces = buildTracesSection({
    totalHits: totals.totalHits,
    // Denominador del top de usuarios: tiempo de navegación identificado del mes.
    // Se excluye la cuenta sin identificar por la misma razón por la que no
    // aparece en la tabla: no es una persona (S9).
    totalBrowsingMs: totals.users.reduce(
      (sum, user) => sum + (user.username === null ? 0 : user.browsingMs),
      0,
    ),
    sites: totals.sites,
    siteUsers: totals.siteUsers,
    users: totals.users,
    selection: input.selection,
    nationalExclusions: input.nationalExclusions,
    limit: input.limit,
  });

  return {
    period,
    coverage: { ...coverage, unidentifiedHits: totals.unidentifiedHits },
    totals,
    traces,
    declarations: {
      browsingTimeApproximate: input.browsingTimeCalibrated !== true,
      incompleteCoverage: coverage.missingDays.length > 0,
    },
  };
}
