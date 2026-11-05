import { formatHoursMinutes, formatInteger, formatSize } from "../format";

/**
 * Armado de la sección de trazas de la plantilla oficial v2.
 *
 * La plantilla nueva ya no separa nacional/internacional ni pide drill-downs:
 * son tres tablas planas de cinco filas. Acá se arma esa estructura; qué medir
 * vive en `metrics/` y cómo se ve un número vive en `format/`.
 *
 * Reglas de selección:
 *
 * - **Sitios (S4):** top 5 por `Browsing Time` del sitio, no por hits. La
 *   telemetría suma en los totales pero no compite. `Cantidad de usuarios` son
 *   los usuarios distintos del mes, sin contar el tráfico sin cuenta.
 * - **Usuarios con más tiempo (S5):** top 5 por el reloj del usuario.
 * - **Usuarios con más descargas (S6):** top 5 por `bytesIn`. El título dice
 *   "descargas", así que ordena el volumen descargado, no el tiempo.
 *
 * Los nombres y cargos salen de `AccountRequest`; el documento no consulta la
 * base: los recibe ya resueltos en `profiles`.
 */

export const TOP_ROWS = 5;

export type SiteTotals = {
  site: string;
  hits: number;
  bytesIn: number;
  bytesOut: number;
  elapsedMs: number;
  browsingMs: number;
  /**
   * Telemetría, publicidad o infraestructura: suma en los totales, pero no
   * compite en las tablas de sitios (S26 de la plantilla v1, vigente en v2).
   */
  telemetry?: boolean;
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

/** Perfil de la cuenta, ya resuelto desde `AccountRequest`. */
export type UserProfile = {
  fullName: string;
  position: string;
};

/** Perfiles indexados por `username` en minúsculas. */
export type UserProfiles = Readonly<Record<string, UserProfile>>;

export type TopSiteRow = {
  site: string;
  browsingTime: string;
  users: string;
};

export type TopUserRow = {
  username: string;
  fullName: string;
  browsingTime: string;
};

export type TopDownloadRow = {
  username: string;
  fullName: string;
  downloaded: string;
};

export type TracesSection = {
  topSites: TopSiteRow[];
  topUsers: TopUserRow[];
  topDownloads: TopDownloadRow[];
};

export type TracesSectionInput = {
  sites: readonly SiteTotals[];
  siteUsers: readonly SiteUserTotals[];
  users: readonly UserTotals[];
  /** Perfiles por `username` en minúsculas; sin perfil el nombre queda vacío. */
  profiles?: UserProfiles;
  /** Recorte de filas al renderizar. Nunca se aplica al persistir. */
  limit?: number;
};

function profileMap(profiles: UserProfiles | undefined): Map<string, UserProfile> {
  return new Map(
    Object.entries(profiles ?? {}).map(([username, profile]) => [
      username.toLowerCase(),
      profile,
    ]),
  );
}

function fullNameFor(
  profiles: Map<string, UserProfile>,
  username: string,
): string {
  return profiles.get(username.toLowerCase())?.fullName ?? "";
}

/** Usuarios distintos por sitio, para la columna `Cantidad de usuarios`. */
function distinctUsersBySite(
  siteUsers: readonly SiteUserTotals[],
): Map<string, number> {
  const usersBySite = new Map<string, Set<string>>();

  for (const row of siteUsers) {
    if (row.username === null) continue;

    const users = usersBySite.get(row.site) ?? new Set<string>();
    users.add(row.username);
    usersBySite.set(row.site, users);
  }

  return new Map(
    [...usersBySite.entries()].map(([site, users]) => [site, users.size]),
  );
}

/** Top 5 de sitios por `Browsing Time` (S4). */
export function buildTopSites(
  sites: readonly SiteTotals[],
  siteUsers: readonly SiteUserTotals[],
  limit: number = TOP_ROWS,
): TopSiteRow[] {
  const usersBySite = distinctUsersBySite(siteUsers);

  return [...sites]
    .filter((site) => site.telemetry !== true)
    .sort(
      (a, b) => b.browsingMs - a.browsingMs || a.site.localeCompare(b.site),
    )
    .slice(0, limit)
    .map((site) => ({
      site: site.site,
      browsingTime: formatHoursMinutes(site.browsingMs),
      users: formatInteger(usersBySite.get(site.site) ?? 0),
    }));
}

/** Top 5 de usuarios por tiempo de navegación (S5). */
export function buildTopUsers(
  users: readonly UserTotals[],
  profiles: UserProfiles = {},
  limit: number = TOP_ROWS,
): TopUserRow[] {
  const byUser = profileMap(profiles);

  return [...users]
    .filter(
      (user): user is UserTotals & { username: string } =>
        user.username !== null,
    )
    .sort(
      (a, b) =>
        b.browsingMs - a.browsingMs ||
        b.hits - a.hits ||
        a.username.localeCompare(b.username),
    )
    .slice(0, limit)
    .map((user) => ({
      username: user.username,
      fullName: fullNameFor(byUser, user.username),
      browsingTime: formatHoursMinutes(user.browsingMs),
    }));
}

/** Top 5 de usuarios por volumen descargado (S6). */
export function buildTopDownloads(
  users: readonly UserTotals[],
  profiles: UserProfiles = {},
  limit: number = TOP_ROWS,
): TopDownloadRow[] {
  const byUser = profileMap(profiles);

  return [...users]
    .filter(
      (user): user is UserTotals & { username: string } =>
        user.username !== null,
    )
    .sort(
      (a, b) =>
        b.bytesIn - a.bytesIn || a.username.localeCompare(b.username),
    )
    .slice(0, limit)
    .map((user) => ({
      username: user.username,
      fullName: fullNameFor(byUser, user.username),
      downloaded: formatSize(user.bytesIn),
    }));
}

export function buildTracesSection(
  input: TracesSectionInput,
): TracesSection {
  const limit = input.limit ?? TOP_ROWS;
  const profiles = input.profiles ?? {};

  return {
    topSites: buildTopSites(input.sites, input.siteUsers, limit),
    topUsers: buildTopUsers(input.users, profiles, limit),
    topDownloads: buildTopDownloads(input.users, profiles, limit),
  };
}
