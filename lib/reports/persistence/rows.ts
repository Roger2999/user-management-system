import type { DailyMetrics } from "../metrics/aggregate";

/**
 * Traducción de las métricas diarias a filas de base de datos.
 *
 * Es una función pura a propósito: la persistencia no decide qué medir, solo
 * escribe lo que el acumulador ya calculó. Así el mapeo se prueba sin base de
 * datos y la escritura se prueba contra la base real.
 *
 * **Los pares sin cuenta no se escriben.** `DailySiteUserStat.proxyAccountId` es
 * una clave foránea a `ProxyAccount`, y crear una cuenta ficticia para el tráfico
 * anónimo rompería S9 ("una cuenta = una persona"). El tráfico sin identificar
 * no se pierde: sigue en `DailySiteStat`, y los hits sin cuenta se reconstruyen
 * como la diferencia entre los hits de los sitios y los de las cuentas. Con la
 * definición de hit vigente (respuesta servida, S2) esa diferencia es 0 salvo
 * que una respuesta servida no se haya autenticado. Las tablas del documento
 * excluyen ese tráfico de todas formas (`buildSiteUserTableRows` filtra
 * `username === null`), así que la ida y vuelta no pierde nada que se imprima.
 */

export type DailySiteStatRow = {
  day: string;
  site: string;
  hits: number;
  bytesIn: number;
  bytesOut: number;
  elapsedMs: number;
  browsingMs: number;
};

export type DailyUserStatRow = {
  day: string;
  username: string;
  hits: number;
  bytesIn: number;
  bytesOut: number;
  elapsedMs: number;
  browsingMs: number;
};

export type DailySiteUserStatRow = {
  day: string;
  site: string;
  username: string;
  hits: number;
  bytesIn: number;
  elapsedMs: number;
  browsingMs: number;
};

export type DailyStatRows = {
  sites: DailySiteStatRow[];
  users: DailyUserStatRow[];
  siteUsers: DailySiteUserStatRow[];
};

/**
 * Convierte los días agregados en filas.
 *
 * Se persisten **todos** los pares (sitio, usuario) de todos los sitios (S17):
 * el recorte a 10 filas ocurre al renderizar. Truncar acá rompería el
 * denominador del `% of Browsing Time` del drill-down (S15).
 */
export function toDailyStatRows(days: readonly DailyMetrics[]): DailyStatRows {
  const sites: DailySiteStatRow[] = [];
  const users: DailyUserStatRow[] = [];
  const siteUsers: DailySiteUserStatRow[] = [];

  for (const day of days) {
    for (const row of day.sites) {
      sites.push({
        day: day.day,
        site: row.site,
        hits: row.hits,
        bytesIn: row.bytesIn,
        bytesOut: row.bytesOut,
        elapsedMs: row.elapsedMs,
        browsingMs: row.browsingMs,
      });
    }

    for (const row of day.users) {
      if (row.username === null) continue;

      users.push({
        day: day.day,
        username: row.username,
        hits: row.hits,
        bytesIn: row.bytesIn,
        bytesOut: row.bytesOut,
        elapsedMs: row.elapsedMs,
        browsingMs: row.browsingMs,
      });
    }

    for (const row of day.siteUsers) {
      if (row.username === null) continue;

      siteUsers.push({
        day: day.day,
        site: row.site,
        username: row.username,
        hits: row.hits,
        bytesIn: row.bytesIn,
        elapsedMs: row.elapsedMs,
        browsingMs: row.browsingMs,
      });
    }
  }

  return { sites, users, siteUsers };
}

/**
 * Cuentas que hay que existir antes de escribir las estadísticas.
 *
 * S9: una cuenta sin registro no se descarta. Se crea el `ProxyAccount` con el
 * username crudo; el nombre y el cargo se completan después.
 */
export function collectUsernames(days: readonly DailyMetrics[]): string[] {
  const usernames = new Set<string>();

  for (const day of days) {
    for (const row of day.users) {
      if (row.username !== null) usernames.add(row.username);
    }
  }

  return [...usernames].sort((a, b) => a.localeCompare(b));
}
