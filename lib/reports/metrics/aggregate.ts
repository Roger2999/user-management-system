import {
  DEFAULT_TELEMETRY_PATTERNS,
  extractSite,
  isInternalSite,
  isTelemetrySite,
} from "../classify/site";
import type { SquidLogRecord } from "../types";

/**
 * Agregación diaria con la semántica del informe vigente.
 *
 * Reglas que no son obvias y que están acá porque son las que hacen que los
 * números coincidan con el documento:
 *
 * - `Hits` es la cantidad de respuestas servidas por el sitio (2xx/3xx) a un
 *   destino que no es interno. El reto 407, la denegación 403 y el error 5xx no
 *   son visitas: el reto es la misma petición que después se registra
 *   autenticada, y el destino interno (el WSUS, por ejemplo) no es navegación.
 * - `Incoming` es la suma del campo `bytes` de esos hits.
 * - `Outgoing` es la suma del campo `bytes` para métodos de subida.
 * - `Download Time` es la suma de `elapsed`: el tiempo que el proxy tardó en
 *   bajar el recurso. WebSpy lo toma directo del log, no lo calcula.
 * - `Browsing Time` NO es un campo del log: se agrupan los hits en sesiones
 *   (huecos entre hits consecutivos ≤ umbral) y cada sesión vale
 *   `último − primero`. Se acumulan **tres relojes independientes** sobre los
 *   mismos hits, porque WebSpy calcula el agregado sobre el summary del nodo:
 *   el del sitio, el del par (sitio, usuario) y el del usuario.
 *
 *   Ninguno se deriva de otro. El reloj del usuario no es la suma de sus pares:
 *   las sesiones de sitios distintos se solapan en el tiempo y sumarlas cuenta
 *   dos veces. La KB de WebSpy lo dice con un ejemplo: un usuario con 6 h puede
 *   mostrar 4 h en un sitio, 5 h en otro y 6 h en otro.
 */

export const UNKNOWN_SITE = "(desconocido)";
export const UNIDENTIFIED_ACCOUNT = "";

/**
 * Umbral de corte de sesión, en milisegundos.
 *
 * Es **uno solo y global**, como en WebSpy (`Tools | Options | General`,
 * `Session Threshold`), y su default es 5 minutos. No hay un umbral distinto
 * por nivel de agregación: lo que cambia entre el reloj del sitio y el del
 * usuario es la entidad sobre la que se calculan las sesiones, no el corte.
 *
 * Pendiente de calibrar contra la salida real de WebSpy (R1): si el valor no se
 * reproduce exacto, el informe declara la aproximación (S12).
 */
export const DEFAULT_BROWSING_GAP_MS = 5 * 60 * 1000;

export const DEFAULT_UPLOAD_METHODS = ["POST", "PUT"] as const;

/** Líneas descartadas del informe y por qué. Se declaran en la cobertura (S7). */
export type SkippedLines = {
  /** No servidas por el sitio: 4xx, 5xx, 000 o sin código HTTP. */
  unserved: number;
  /** Servidas a un destino interno (RFC 1918, loopback, `.local`, ...). */
  internal: number;
  /**
   * Servidas a telemetría, publicidad, actualizaciones o revocación de
   * certificados. **No** son descartes del informe: entran en `Hits`, `Incoming`
   * y en las métricas de usuario, y se excluyen solo de las tablas de sitios.
   */
  telemetry: number;
};

/**
 * `true` cuando el proxy obtuvo respuesta del sitio.
 *
 * Solo 2xx y 3xx: un 407 es el reto de autenticación, un 403 una denegación y
 * un 5xx un fallo. Ninguno de los tres es una visita.
 */
export function isServedResponse(httpStatus: number | null): boolean {
  return httpStatus !== null && httpStatus >= 200 && httpStatus < 400;
}

export type DailyMetricsOptions = {
  /** Umbral de corte de sesión, compartido por los tres relojes. */
  browsingGapMs?: number;
  uploadMethods?: readonly string[];
  /**
   * Dominios que no son navegación (telemetría, publicidad, actualizaciones).
   * Por defecto `DEFAULT_TELEMETRY_PATTERNS`; se puede reemplazar por completo.
   * Solo deciden qué sitios se excluyen de las tablas: sus hits siguen contando
   * en los totales.
   */
  telemetryPatterns?: readonly string[];
};

export type DailyUserMetrics = {
  username: string | null;
  hits: number;
  bytesIn: number;
  bytesOut: number;
  elapsedMs: number;
  /** Reloj del usuario: sesiones sobre todos sus hits, sin importar el sitio. */
  browsingMs: number;
};

export type DailySiteMetrics = {
  site: string;
  hits: number;
  bytesIn: number;
  bytesOut: number;
  elapsedMs: number;
  /** Reloj del sitio: sesiones sobre todos los hits de ese sitio. */
  browsingMs: number;
  /**
   * El sitio es telemetría, publicidad o infraestructura: entra en los totales
   * pero no en las tablas de sitios ni en sus drill-downs (S26).
   */
  telemetry: boolean;
};

export type DailySiteUserMetrics = {
  site: string;
  username: string | null;
  hits: number;
  bytesIn: number;
  elapsedMs: number;
  /** Reloj del par (sitio, usuario): sesiones de esa cuenta en ese sitio. */
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
  /** Líneas del día descartadas por no ser hit, por motivo (S7). */
  skipped: SkippedLines;
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
  private readonly uploadMethods: Set<string>;
  private readonly telemetryPatterns: readonly string[];
  private readonly sites = new Map<string, Accumulator>();
  private readonly pairsBySite = new Map<string, Map<string, Accumulator>>();
  private readonly usersByIdentity = new Map<string, Accumulator>();
  private readonly telemetrySites = new Set<string>();

  private totalHits = 0;
  private totalBytesIn = 0;
  private totalBytesOut = 0;
  private totalElapsedMs = 0;
  private unidentifiedHits = 0;
  private skippedUnserved = 0;
  private skippedInternal = 0;
  private skippedTelemetry = 0;

  constructor(
    private readonly day: string,
    options: DailyMetricsOptions = {},
  ) {
    this.browsingGapMs = options.browsingGapMs ?? DEFAULT_BROWSING_GAP_MS;
    this.uploadMethods = new Set(
      (options.uploadMethods ?? DEFAULT_UPLOAD_METHODS).map((method) =>
        method.toUpperCase(),
      ),
    );
    this.telemetryPatterns =
      options.telemetryPatterns ?? DEFAULT_TELEMETRY_PATTERNS;
  }

  add(record: SquidLogRecord): void {
    if (!isServedResponse(record.httpStatus)) {
      this.skippedUnserved += 1;
      return;
    }

    const site = extractSite(record.url);
    if (site !== null && isInternalSite(site)) {
      this.skippedInternal += 1;
      return;
    }

    // La telemetría no se descarta: entra en Hits, Incoming y en el reloj del
    // usuario. Solo se marca para que no compita en las tablas de sitios (S26).
    const telemetry =
      site !== null && isTelemetrySite(site, this.telemetryPatterns);
    if (telemetry) this.skippedTelemetry += 1;

    const resolvedSite = site ?? UNKNOWN_SITE;
    if (telemetry) this.telemetrySites.add(resolvedSite);
    const account = record.username ?? UNIDENTIFIED_ACCOUNT;
    const bytesOut = this.uploadMethods.has(record.method.toUpperCase())
      ? record.bytes
      : 0;

    this.totalHits += 1;
    this.totalBytesIn += record.bytes;
    this.totalBytesOut += bytesOut;
    this.totalElapsedMs += record.elapsedMs;
    if (record.username === null) this.unidentifiedHits += 1;

    // Tres relojes sobre los mismos hits, cada uno con la misma entidad que el
    // summary de WebSpy: el sitio, el par (sitio, usuario) y el usuario.
    let siteAccumulator = this.sites.get(resolvedSite);
    if (siteAccumulator === undefined) {
      siteAccumulator = createAccumulator();
      this.sites.set(resolvedSite, siteAccumulator);
    }
    accumulateRecord(siteAccumulator, record, bytesOut, this.browsingGapMs);

    let pairs = this.pairsBySite.get(resolvedSite);
    if (pairs === undefined) {
      pairs = new Map<string, Accumulator>();
      this.pairsBySite.set(resolvedSite, pairs);
    }

    let accumulator = pairs.get(account);
    if (accumulator === undefined) {
      accumulator = createAccumulator();
      pairs.set(account, accumulator);
    }
    accumulateRecord(accumulator, record, bytesOut, this.browsingGapMs);

    let userAccumulator = this.usersByIdentity.get(account);
    if (userAccumulator === undefined) {
      userAccumulator = createAccumulator();
      this.usersByIdentity.set(account, userAccumulator);
    }
    accumulateRecord(userAccumulator, record, bytesOut, this.browsingGapMs);
  }

  /** Líneas descartadas en el día, por motivo. Se declaran en la cobertura (S7). */
  toSkipped(): SkippedLines {
    return {
      unserved: this.skippedUnserved,
      internal: this.skippedInternal,
      telemetry: this.skippedTelemetry,
    };
  }

  toMetrics(): DailyMetrics {
    const siteUsers: DailySiteUserMetrics[] = [];

    for (const [site, pairs] of this.pairsBySite) {
      for (const [account, accumulator] of pairs) {
        siteUsers.push({
          site,
          username: account === UNIDENTIFIED_ACCOUNT ? null : account,
          hits: accumulator.hits,
          bytesIn: accumulator.bytesIn,
          elapsedMs: accumulator.elapsedMs,
          browsingMs: accumulator.browsingMs,
        });
      }
    }

    // El total por usuario sale de su propio reloj, no de sumar sus pares: los
    // pares se solapan en el tiempo y la suma sobreestima (S25).
    const users = [...this.usersByIdentity].map(([account, accumulator]) => ({
      username: account === UNIDENTIFIED_ACCOUNT ? null : account,
      hits: accumulator.hits,
      bytesIn: accumulator.bytesIn,
      bytesOut: accumulator.bytesOut,
      elapsedMs: accumulator.elapsedMs,
      browsingMs: accumulator.browsingMs,
    }));

    const sites = [...this.sites].map(([site, accumulator]) => ({
      site,
      hits: accumulator.hits,
      bytesIn: accumulator.bytesIn,
      bytesOut: accumulator.bytesOut,
      elapsedMs: accumulator.elapsedMs,
      browsingMs: accumulator.browsingMs,
      telemetry: this.telemetrySites.has(site),
    }));

    return {
      day: this.day,
      totalHits: this.totalHits,
      totalBytesIn: this.totalBytesIn,
      totalBytesOut: this.totalBytesOut,
      totalElapsedMs: this.totalElapsedMs,
      unidentifiedHits: this.unidentifiedHits,
      skipped: this.toSkipped(),
      users: users.sort(
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
