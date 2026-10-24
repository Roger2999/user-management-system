import { extractSite } from "../classify/site";
import type { SquidLogRecord } from "../types";

/**
 * Agregación diaria con la semántica del informe vigente.
 *
 * Reglas que no son obvias y que están acá porque son las que hacen que los
 * números coincidan con el documento:
 *
 * - `Hits` es la cantidad de líneas, incluidos los túneles `CONNECT`.
 * - `Incoming` es la suma del campo `bytes` (respuesta).
 * - `Outgoing` es la suma del campo `bytes` para métodos de subida.
 * - `Download Time` es la suma de `elapsed`, o sea tiempo de proceso del proxy,
 *   no tiempo de descarga del usuario.
 * - `Browsing Time` NO es un campo del log: se acumula por par (sitio, usuario)
 *   como la suma de los intervalos entre hits consecutivos que no superan un
 *   umbral de corte. El total por usuario es la suma de sus pares, y por eso
 *   puede superar las 720 horas de un mes, igual que en el informe actual.
 */

export const UNKNOWN_SITE = "(desconocido)";
export const UNIDENTIFIED_ACCOUNT = "";

/**
 * Umbral de corte de sesión, en milisegundos.
 *
 * Pendiente de calibrar contra la salida real de WebSpy Giga Analyzer (riesgo R1
 * del plan): si
 * el valor no se reproduce exacto, se declara la aproximación en el informe.
 */
export const DEFAULT_BROWSING_GAP_MS = 30 * 60 * 1000;

export const DEFAULT_UPLOAD_METHODS = ["POST", "PUT"] as const;

export type DailyMetricsOptions = {
  /** Umbral de corte para el tiempo de navegación por par (sitio, usuario). */
  browsingGapMs?: number;
  /**
   * Umbral de corte para el tiempo de navegación **del sitio**.
   *
   * Es un acumulador separado a propósito: WebSpy calcula el Browsing Time del
   * sitio y el de sus usuarios con resultados distintos. Para `www.bing.com` del
   * informe de mayo el sitio marca `53:56:25` y la suma de sus 45 usuarios da
   * `37:25:15`. Sumar los pares para obtener el sitio daría el segundo valor, no
   * el primero.
   */
  siteBrowsingGapMs?: number;
  uploadMethods?: readonly string[];
};

export type DailyUserMetrics = {
  username: string | null;
  hits: number;
  bytesIn: number;
  bytesOut: number;
  elapsedMs: number;
  browsingMs: number;
};

export type DailySiteMetrics = {
  site: string;
  hits: number;
  bytesIn: number;
  bytesOut: number;
  elapsedMs: number;
  browsingMs: number;
};

export type DailySiteUserMetrics = {
  site: string;
  username: string | null;
  hits: number;
  bytesIn: number;
  elapsedMs: number;
  browsingMs: number;
};

export type DailyMetrics = {
  day: string;
  totalHits: number;
  totalBytesIn: number;
  totalBytesOut: number;
  totalElapsedMs: number;
  /** Hits sin cuenta de proxy autenticada. */
  unidentifiedHits: number;
  users: DailyUserMetrics[];
  sites: DailySiteMetrics[];
  siteUsers: DailySiteUserMetrics[];
};

type Accumulator = {
  hits: number;
  bytesIn: number;
  bytesOut: number;
  elapsedMs: number;
  browsingMs: number;
  lastTimestampMs: number | null;
};

function createAccumulator(): Accumulator {
  return {
    hits: 0,
    bytesIn: 0,
    bytesOut: 0,
    elapsedMs: 0,
    browsingMs: 0,
    lastTimestampMs: null,
  };
}

function accumulateRecord(
  accumulator: Accumulator,
  record: SquidLogRecord,
  bytesOut: number,
  gapMs: number,
): void {
  accumulator.hits += 1;
  accumulator.bytesIn += record.bytes;
  accumulator.bytesOut += bytesOut;
  accumulator.elapsedMs += record.elapsedMs;

  if (accumulator.lastTimestampMs === null) {
    accumulator.lastTimestampMs = record.timestampMs;
    return;
  }

  const gap = record.timestampMs - accumulator.lastTimestampMs;
  if (gap < 0) return;

  if (gap <= gapMs) accumulator.browsingMs += gap;
  accumulator.lastTimestampMs = record.timestampMs;
}

function accountSortKey(username: string | null): string {
  // Las cuentas sin identificar van al final: son ruido de calidad de dato.
  return username ?? "\uFFFF";
}

/**
 * Acumula un día local completo.
 *
 * Requiere que los registros lleguen en orden cronológico, que es como Squid
 * escribe el `access.log`. Un registro fuera de orden no aporta tiempo de
 * navegación y no rompe el acumulador.
 */
export class DailyMetricsAccumulator {
  private readonly browsingGapMs: number;
  private readonly siteBrowsingGapMs: number;
  private readonly uploadMethods: Set<string>;
  private readonly sites = new Map<string, Accumulator>();
  private readonly pairsBySite = new Map<string, Map<string, Accumulator>>();

  private totalHits = 0;
  private totalBytesIn = 0;
  private totalBytesOut = 0;
  private totalElapsedMs = 0;
  private unidentifiedHits = 0;

  constructor(
    private readonly day: string,
    options: DailyMetricsOptions = {},
  ) {
    this.browsingGapMs = options.browsingGapMs ?? DEFAULT_BROWSING_GAP_MS;
    this.siteBrowsingGapMs =
      options.siteBrowsingGapMs ?? this.browsingGapMs;
    this.uploadMethods = new Set(
      (options.uploadMethods ?? DEFAULT_UPLOAD_METHODS).map((method) =>
        method.toUpperCase(),
      ),
    );
  }

  add(record: SquidLogRecord): void {
    const site = extractSite(record.url) ?? UNKNOWN_SITE;
    const account = record.username ?? UNIDENTIFIED_ACCOUNT;
    const bytesOut = this.uploadMethods.has(record.method.toUpperCase())
      ? record.bytes
      : 0;

    this.totalHits += 1;
    this.totalBytesIn += record.bytes;
    this.totalBytesOut += bytesOut;
    this.totalElapsedMs += record.elapsedMs;
    if (record.username === null) this.unidentifiedHits += 1;

    // El sitio y el par (sitio, usuario) son dos agregaciones distintas, cada una
    // con su propio reloj: el mismo tráfico produce tiempos de navegación
    // diferentes. Sumar los pares no reproduce el Browsing Time del sitio.
    let siteAccumulator = this.sites.get(site);
    if (siteAccumulator === undefined) {
      siteAccumulator = createAccumulator();
      this.sites.set(site, siteAccumulator);
    }
    accumulateRecord(siteAccumulator, record, bytesOut, this.siteBrowsingGapMs);

    let pairs = this.pairsBySite.get(site);
    if (pairs === undefined) {
      pairs = new Map<string, Accumulator>();
      this.pairsBySite.set(site, pairs);
    }

    let accumulator = pairs.get(account);
    if (accumulator === undefined) {
      accumulator = createAccumulator();
      pairs.set(account, accumulator);
    }

    accumulateRecord(accumulator, record, bytesOut, this.browsingGapMs);
  }

  toMetrics(): DailyMetrics {
    const users = new Map<string, DailyUserMetrics>();
    const siteUsers: DailySiteUserMetrics[] = [];

    for (const [site, pairs] of this.pairsBySite) {
      for (const [account, accumulator] of pairs) {
        const username = account === UNIDENTIFIED_ACCOUNT ? null : account;

        siteUsers.push({
          site,
          username,
          hits: accumulator.hits,
          bytesIn: accumulator.bytesIn,
          elapsedMs: accumulator.elapsedMs,
          browsingMs: accumulator.browsingMs,
        });

        const user = users.get(account);
        if (user === undefined) {
          users.set(account, {
            username,
            hits: accumulator.hits,
            bytesIn: accumulator.bytesIn,
            bytesOut: accumulator.bytesOut,
            elapsedMs: accumulator.elapsedMs,
            browsingMs: accumulator.browsingMs,
          });
        } else {
          user.hits += accumulator.hits;
          user.bytesIn += accumulator.bytesIn;
          user.bytesOut += accumulator.bytesOut;
          user.elapsedMs += accumulator.elapsedMs;
          user.browsingMs += accumulator.browsingMs;
        }
      }
    }

    const sites = [...this.sites].map(([site, accumulator]) => ({
      site,
      hits: accumulator.hits,
      bytesIn: accumulator.bytesIn,
      bytesOut: accumulator.bytesOut,
      elapsedMs: accumulator.elapsedMs,
      browsingMs: accumulator.browsingMs,
    }));

    return {
      day: this.day,
      totalHits: this.totalHits,
      totalBytesIn: this.totalBytesIn,
      totalBytesOut: this.totalBytesOut,
      totalElapsedMs: this.totalElapsedMs,
      unidentifiedHits: this.unidentifiedHits,
      users: [...users.values()].sort(
        (a, b) =>
          b.hits - a.hits ||
          accountSortKey(a.username).localeCompare(accountSortKey(b.username)),
      ),
      sites: sites.sort(
        (a, b) => b.hits - a.hits || a.site.localeCompare(b.site),
      ),
      siteUsers: siteUsers.sort(
        (a, b) =>
          a.site.localeCompare(b.site) ||
          b.hits - a.hits ||
          accountSortKey(a.username).localeCompare(accountSortKey(b.username)),
      ),
    };
  }
}
