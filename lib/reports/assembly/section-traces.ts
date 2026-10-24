import { classifySite } from "../classify/site";
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
 * Sitios que el especialista confirma para el informe.
 *
 * La selección es un dato del informe, no un cálculo: la tabla internacional del
 * documento vigente no es ni el top por hits ni el top por `Browsing Time`
 * (`google.com` tiene 90,921 hits y no aparece; `kimi.com` entra con 2,731). Por
 * eso se declara y no se deduce. `proposeSiteSelection` propone un top por hits
 * como punto de partida, y la lista final la confirma el especialista.
 */
export type SiteSelection = {
  /** Sitios de la tabla internacional, por nombre tal como aparece en el log. */
  international: readonly string[];
  /** Sitios de la tabla nacional. */
  national: readonly string[];
  /** Sitios con drill-down de usuarios, en el orden del documento. */
  drilldowns: readonly string[];
};

export type ProposeSelectionOptions = {
  limit?: number;
  nationalExclusions?: readonly string[];
};

/**
 * Propuesta de selección: el top por hits de cada clasificación.
 *
 * Es solo una propuesta. Sirve para que el especialista parta de algo y ajuste;
 * no es lo que el informe de mayo tiene, y no se usa como default en
 * `buildTracesSection` a propósito: un default silencioso volvería a calcular la
 * selección, que es justo lo que S20 prohíbe.
 */
export function proposeSiteSelection(
  sites: readonly SiteTotals[],
  options: ProposeSelectionOptions = {},
): SiteSelection {
  const limit = options.limit ?? TOP_ROWS;
  const byHits = [...sites].sort(
    (a, b) => b.hits - a.hits || a.site.localeCompare(b.site),
  );
  const pick = (kind: "national" | "international") =>
    byHits
      .filter(
        (site) => classifySite(site.site, options.nationalExclusions) === kind,
      )
      .slice(0, limit)
      .map((site) => site.site);

  const international = pick("international");

  return {
    international,
    national: pick("national"),
    drilldowns: international,
  };
}

export type TracesSection = {
  internationalSites: SiteTableRow[];
  nationalSites: SiteTableRow[];
  siteDrilldowns: Array<{ site: string; rows: SiteUserTableRow[] }>;
  topUsers: UserTableRow[];
};

export type TracesSectionInput = {
  totalHits: number;
  totalBrowsingMs: number;
  sites: readonly SiteTotals[];
  siteUsers: readonly SiteUserTotals[];
  users: readonly UserTotals[];
  selection: SiteSelection;
  nationalExclusions?: readonly string[];
  /** Recorte de filas al renderizar. Nunca se aplica al persistir (S17). */
  limit?: number;
};

/**
 * Resuelve la selección contra los sitios con tráfico.
 *
 * Falla en vez de emitir una tabla incompleta: un sitio seleccionado sin tráfico
 * o puesto en la tabla equivocada es un error del informe, no una fila vacía.
 */
function selectSites(
  sites: readonly SiteTotals[],
  names: readonly string[],
  expected: "national" | "international",
  nationalExclusions: readonly string[] | undefined,
): SiteTotals[] {
  const byName = new Map(sites.map((site) => [site.site, site]));
  const missing: string[] = [];
  const misclassified: string[] = [];
  const selected: SiteTotals[] = [];

  for (const name of names) {
    const site = byName.get(name);
    if (site === undefined) {
      missing.push(name);
      continue;
    }

    if (classifySite(site.site, nationalExclusions) !== expected) {
      misclassified.push(name);
      continue;
    }

    selected.push(site);
  }

  if (missing.length > 0) {
    throw new RangeError(
      `sitios seleccionados sin tráfico en el período: ${missing.join(", ")}`,
    );
  }

  if (misclassified.length > 0) {
    throw new RangeError(
      `sitios fuera de la clasificación ${expected}: ${misclassified.join(", ")}`,
    );
  }

  return selected;
}

export function buildTracesSection(input: TracesSectionInput): TracesSection {
  const limit = input.limit ?? TOP_ROWS;

  const international = selectSites(
    input.sites,
    input.selection.international,
    "international",
    input.nationalExclusions,
  );
  const national = selectSites(
    input.sites,
    input.selection.national,
    "national",
    input.nationalExclusions,
  );

  const internationalSites = buildSiteTableRows(
    international,
    input.totalHits,
    limit,
  );
  const nationalSites = buildSiteTableRows(national, input.totalHits, limit);

  const usersBySite = new Map<string, SiteUserTotals[]>();
  for (const row of input.siteUsers) {
    const bucket = usersBySite.get(row.site);
    if (bucket === undefined) {
      usersBySite.set(row.site, [row]);
    } else {
      bucket.push(row);
    }
  }

  // El drill-down sigue el orden declarado, no el de la tabla de sitios: son
  // datos distintos del informe y el especialista puede ordenarlos.
  const siteDrilldowns = input.selection.drilldowns.map((site) => {
    if (!input.sites.some((row) => row.site === site)) {
      throw new RangeError(
        `sitio con drill-down sin tráfico en el período: ${site}`,
      );
    }

    return {
      site,
      rows: buildSiteUserTableRows(usersBySite.get(site) ?? [], { limit }),
    };
  });

  return {
    internationalSites,
    nationalSites,
    siteDrilldowns,
    topUsers: buildTopUsersTableRows(input.users, input.totalBrowsingMs, limit),
  };
}
