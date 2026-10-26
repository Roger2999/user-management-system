import { classifySite } from "../classify/site";
import {
  DEFAULT_SOCIAL_NETWORKS,
  socialNetworkFor,
  type SocialNetwork,
} from "../classify/social";
import {
  formatDuration,
  formatInteger,
  formatMegabytes,
  formatPercentage,
} from "../format";

/**
 * Armado de la sección 1 del informe: las tablas de trazas.
 *
 * Acá no se decide qué medir (eso es `metrics/`) ni cómo se ve un número (eso
 * es `format/`). Acá se arma la estructura exacta que el documento oficial
 * espera, con las cabeceras textuales que trae hoy.
 *
 * Las tres tablas de la sección, en el orden del documento vigente:
 *
 * 1. Sitios internacionales más visitados (7 columnas).
 * 2. Drill-down por sitio: los 10 usuarios que más accedieron a cada uno (6).
 * 3. Los 10 usuarios que más descargaron (7).
 *
 * Regla de "sitios más visitados" (S20): las dos tablas de sitios son el top 10
 * por hits, calculado por el sistema. La selección no se declara.
 *
 * Los drill-downs son esos mismos sitios, en el orden de la tabla internacional,
 * y dentro de cada uno los 10 usuarios se ordenan por `Browsing Time` (S15).
 * Esa es la métrica del drill-down, no la de la tabla de sitios.
 */

export const TOP_ROWS = 10;

export const SITE_TABLE_HEADERS = [
  "Sites",
  "Hits",
  "Incoming (MB)",
  "Outgoing (MB)",
  "Download Time (h:m:s)",
  "Browsing Time (h:m:s)",
  "% of Hits",
] as const;

/**
 * La cabecera del drill-down dice `(h:m:s)` pero los valores son porcentajes.
 * Es un defecto de la herramienta de origen y se reproduce textualmente: el
 * documento generado tiene que ser indistinguible del vigente.
 *
 * Es la única cabecera de drill-down. El documento de mayo tiene dos tablas
 * (`clarity.ms` y `windy.com`) exportadas con `% of Hits` y ordenadas por hits;
 * se normalizan a esta, por decisión del usuario: dos tablas del mismo tipo no
 * pueden medir cosas distintas en un informe oficial.
 */
export const SITE_USER_TABLE_HEADERS = [
  "Users",
  "Hits",
  "Incoming (MB)",
  "Download Time (h:m:s)",
  "Browsing Time (h:m:s)",
  "% of Browsing Time (h:m:s)",
] as const;

export const TOP_USERS_TABLE_HEADERS = [
  "Users",
  "Hits",
  "Incoming (MB)",
  "Outgoing (MB)",
  "Download Time (h:m:s)",
  "Browsing Time (h:m:s)",
  "% of Browsing Time (h:m:s)",
] as const;

export type SiteTotals = {
  site: string;
  hits: number;
  bytesIn: number;
  bytesOut: number;
  elapsedMs: number;
  browsingMs: number;
};

export type SiteUserTotals = {
  site: string;
  username: string | null;
  hits: number;
  bytesIn: number;
  elapsedMs: number;
  browsingMs: number;
};

export type UserTotals = {
  username: string | null;
  hits: number;
  bytesIn: number;
  bytesOut: number;
  elapsedMs: number;
  browsingMs: number;
};

export type SiteTableRow = {
  site: string;
  hits: string;
  incoming: string;
  outgoing: string;
  downloadTime: string;
  browsingTime: string;
  percentOfHits: string;
};

export type SiteUserTableRow = {
  username: string;
  hits: string;
  incoming: string;
  downloadTime: string;
  browsingTime: string;
  percentOfBrowsingTime: string;
};

export type UserTableRow = {
  username: string;
  hits: string;
  incoming: string;
  outgoing: string;
  downloadTime: string;
  browsingTime: string;
  percentOfBrowsingTime: string;
};

export type SocialSection = {
  /** Nombre de la red con más `Browsing Time` de usuarios. */
  network: string;
  rows: SiteUserTableRow[];
};

/** Filas de la tabla de sitios, ordenadas por hits descendente. */
export function buildSiteTableRows(
  sites: readonly SiteTotals[],
  totalHits: number,
  limit: number = TOP_ROWS,
): SiteTableRow[] {
  return [...sites]
    .sort((a, b) => b.hits - a.hits || a.site.localeCompare(b.site))
    .slice(0, limit)
    .map((site) => ({
      site: site.site,
      hits: formatInteger(site.hits),
      incoming: formatMegabytes(site.bytesIn),
      outgoing: formatMegabytes(site.bytesOut),
      downloadTime: formatDuration(site.elapsedMs),
      browsingTime: formatDuration(site.browsingMs),
      percentOfHits: formatPercentage(site.hits, totalHits),
    }));
}

export type SiteUserTableOptions = {
  limit?: number;
  /**
   * Denominador del `% of Browsing Time`.
   *
   * Es la suma del `Browsing Time` de **todos** los usuarios del sitio, o sea la
   * fila `Total` del export de usuarios de WebSpy. Verificado contra tres sitios
   * de mayo 2026: bing `37:25:15` (134,715 s), instagram `40:58:59` (147,539 s),
   * facebook `146:33:51` (527,631 s).
   *
   * No es el `Browsing Time` que la tabla de sitios muestra para ese sitio: para
   * bing ese valor es `53:56:25` (194,185 s) y para instagram `157:52:37`
   * (568,357 s). Son dos métricas calculadas con relojes distintos; usar la de la
   * tabla de sitios como denominador produce porcentajes que no coinciden con el
   * documento.
   *
   * Se deja explícito porque no es un detalle cosmético: es la diferencia entre
   * reproducir el documento y parecer que lo reproduce.
   *
   * Detalle abierto: si el sitio tuviera tráfico sin cuenta, no hay evidencia de
   * si ese tráfico entra en el `Total` del drill-down. Por ahora queda fuera y
   * cuando exista se declara en la calidad del dato.
   */
  basisMs?: number;
};

/**
 * Filas del drill-down de un sitio.
 *
 * Orden: `Browsing Time` descendente. Está verificado contra dos sitios del
 * documento; en `www.youtube.com` el usuario con más hits no es el primero,
 * justamente porque el orden no es por hits.
 */
export function buildSiteUserTableRows(
  rows: readonly SiteUserTotals[],
  options: SiteUserTableOptions = {},
): SiteUserTableRow[] {
  const limit = options.limit ?? TOP_ROWS;
  const identified = rows.filter(
    (row): row is SiteUserTotals & { username: string } => row.username !== null,
  );

  const basisMs =
    options.basisMs ?? identified.reduce((sum, row) => sum + row.browsingMs, 0);

  return [...identified]
    .sort(
      (a, b) =>
        b.browsingMs - a.browsingMs ||
        b.hits - a.hits ||
        a.username.localeCompare(b.username),
    )
    .slice(0, limit)
    .map((row) => ({
      username: row.username,
      hits: formatInteger(row.hits),
      incoming: formatMegabytes(row.bytesIn),
      downloadTime: formatDuration(row.elapsedMs),
      browsingTime: formatDuration(row.browsingMs),
      percentOfBrowsingTime: formatPercentage(row.browsingMs, basisMs),
    }));
}

/**
 * Filas de la tabla de los 10 usuarios que más descargaron.
 *
 * El título dice "descargaron" pero el orden NO es por volumen: `red.social2`
 * (47,321.10 MB) aparece antes que `amaury` (604,006.72 MB). El único orden que
 * explica el documento es `Browsing Time` descendente, y el porcentaje
 * descendente lo confirma.
 *
 * El denominador es el tiempo de navegación total del mes, no el del sitio:
 * `red.social2` (5.5%) y `amaury` (3.2%) implican el mismo total.
 */
export function buildTopUsersTableRows(
  users: readonly UserTotals[],
  totalBrowsingMs: number,
  limit: number = TOP_ROWS,
): UserTableRow[] {
  return [...users]
    .filter((user): user is UserTotals & { username: string } => user.username !== null)
    .sort(
      (a, b) =>
        b.browsingMs - a.browsingMs ||
        b.hits - a.hits ||
        a.username.localeCompare(b.username),
    )
    .slice(0, limit)
    .map((user) => ({
      username: user.username,
      hits: formatInteger(user.hits),
      incoming: formatMegabytes(user.bytesIn),
      outgoing: formatMegabytes(user.bytesOut),
      downloadTime: formatDuration(user.elapsedMs),
      browsingTime: formatDuration(user.browsingMs),
      percentOfBrowsingTime: formatPercentage(user.browsingMs, totalBrowsingMs),
    }));
}

/**
 * Filas de la sección "Redes Sociales más utilizadas en la entidad".
 *
 * La red se elige por el `Browsing Time` de sus usuarios, no por hits ni por el
 * `Browsing Time` del sitio: el reloj del sitio y el del par (sitio, usuario)
 * son métricas distintas (S12, S18). El denominador del `% of Browsing Time` es
 * la suma de todos los usuarios identificados de la red, igual que en el
 * drill-down de un sitio (S15).
 *
 * Un usuario puede aparecer en varios dominios de la misma red; sus valores se
 * suman antes de ordenar. Las conexiones directas por IP no se clasifican.
 */
export function buildSocialSection(
  rows: readonly SiteUserTotals[],
  networks: readonly SocialNetwork[] = DEFAULT_SOCIAL_NETWORKS,
  limit: number = TOP_ROWS,
): SocialSection | null {
  const byNetwork = new Map<
    string,
    { name: string; rows: SiteUserTotals[] }
  >();

  for (const row of rows) {
    if (row.username === null) continue;

    const network = socialNetworkFor(row.site, networks);
    if (network === null) continue;

    const bucket = byNetwork.get(network.name) ?? {
      name: network.name,
      rows: [],
    };
    bucket.rows.push(row);
    byNetwork.set(network.name, bucket);
  }

  if (byNetwork.size === 0) return null;

  const ranked = [...byNetwork.values()]
    .map((bucket) => ({
      ...bucket,
      totalBrowsingMs: bucket.rows.reduce(
        (sum, row) => sum + row.browsingMs,
        0,
      ),
    }))
    .sort(
      (a, b) =>
        b.totalBrowsingMs - a.totalBrowsingMs ||
        a.name.localeCompare(b.name),
    );

  const top = ranked[0];
  const users = new Map<string, SiteUserTotals>();

  for (const row of top.rows) {
    const username = row.username as string;
    const current = users.get(username);
    if (current === undefined) {
      users.set(username, { ...row });
      continue;
    }

    current.hits += row.hits;
    current.bytesIn += row.bytesIn;
    current.elapsedMs += row.elapsedMs;
    current.browsingMs += row.browsingMs;
  }

  return {
    network: top.name,
    rows: buildSiteUserTableRows([...users.values()], {
      limit,
      basisMs: top.totalBrowsingMs,
    }),
  };
}

/**
 * Sitios más visitados de una clasificación: top `limit` por hits descendente
 * (S20). Es un cálculo, no una lista declarada.
 */
export type TopSitesOptions = {
  limit?: number;
  kind?: "national" | "international";
  nationalExclusions?: readonly string[];
};

export function selectTopSites(
  sites: readonly SiteTotals[],
  options: TopSitesOptions = {},
): SiteTotals[] {
  const limit = options.limit ?? TOP_ROWS;
  const kind = options.kind ?? "international";

  return [...sites]
    .filter(
      (site) => classifySite(site.site, options.nationalExclusions) === kind,
    )
    .sort((a, b) => b.hits - a.hits || a.site.localeCompare(b.site))
    .slice(0, limit);
}

export type TracesSection = {
  internationalSites: SiteTableRow[];
  nationalSites: SiteTableRow[];
  siteDrilldowns: Array<{ site: string; rows: SiteUserTableRow[] }>;
  topUsers: UserTableRow[];
  social: SocialSection | null;
};

export type TracesSectionInput = {
  totalHits: number;
  totalBrowsingMs: number;
  sites: readonly SiteTotals[];
  siteUsers: readonly SiteUserTotals[];
  users: readonly UserTotals[];
  /**
   * Exclusiones institucionales para la clasificación nacional. Es la única
   * lista que se configura; no decide qué sitios entran, solo cómo se clasifican.
   */
  nationalExclusions?: readonly string[];
  /** Catálogo de redes; por defecto el del informe (sin YouTube). */
  socialNetworks?: readonly SocialNetwork[];
  /** Recorte de filas al renderizar. Nunca se aplica al persistir (S17). */
  limit?: number;
};

export function buildTracesSection(input: TracesSectionInput): TracesSection {
  const limit = input.limit ?? TOP_ROWS;

  // Las dos tablas se calculan: top 10 por hits de cada clasificación (S20).
  const internationalSites = buildSiteTableRows(
    selectTopSites(input.sites, {
      nationalExclusions: input.nationalExclusions,
    }),
    input.totalHits,
    limit,
  );
  const nationalSites = buildSiteTableRows(
    selectTopSites(input.sites, {
      kind: "national",
      nationalExclusions: input.nationalExclusions,
    }),
    input.totalHits,
    limit,
  );

  const usersBySite = new Map<string, SiteUserTotals[]>();
  for (const row of input.siteUsers) {
    const bucket = usersBySite.get(row.site);
    if (bucket === undefined) {
      usersBySite.set(row.site, [row]);
    } else {
      bucket.push(row);
    }
  }

  // Los drill-downs son los mismos sitios de la tabla internacional y en su
  // mismo orden: "de los sitios más visitados, los 10 usuarios que más
  // accedieron a cada uno de estos sitios" (S20).
  const siteDrilldowns = internationalSites.map((row) => ({
    site: row.site,
    rows: buildSiteUserTableRows(usersBySite.get(row.site) ?? [], { limit }),
  }));

  return {
    internationalSites,
    nationalSites,
    siteDrilldowns,
    topUsers: buildTopUsersTableRows(input.users, input.totalBrowsingMs, limit),
    social: buildSocialSection(input.siteUsers, input.socialNetworks, limit),
  };
}
