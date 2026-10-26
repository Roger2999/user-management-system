/**
 * Clasificación de sitios del informe.
 *
 * El documento vigente separa "páginas nacionales" de "internacionales" con una
 * regla explícita: excluir las páginas alojadas en servidores del Organismo
 * (UNE, MINEM, DNC). Por eso la exclusión es configuración y no código.
 */

/**
 * Extrae el sitio (hostname) de una URL de Squid.
 *
 * Cubre las dos formas que aparecen en `access.log`: URL completa para HTTP y
 * `host:puerto` para los túneles `CONNECT` de HTTPS. Devuelve null cuando no se
 * puede determinar, en lugar de inventar un valor.
 */
export function extractSite(url: string): string | null {
  const raw = url.trim();
  if (raw.length === 0) return null;

  let candidate: string;

  if (raw.includes("://")) {
    try {
      candidate = new URL(raw).hostname;
    } catch {
      return null;
    }
  } else if (raw.startsWith("[")) {
    const closingBracket = raw.indexOf("]");
    if (closingBracket === -1) return null;
    candidate = raw.slice(0, closingBracket + 1);
  } else {
    const withoutPath = raw.split("/")[0];
    candidate = withoutPath.replace(/:\d+$/, "");
  }

  const site = candidate.toLowerCase().replace(/\.$/, "");
  if (site.length === 0 || site.includes(" ")) return null;

  return site;
}

/**
 * `true` cuando el sitio es el dominio indicado o un subdominio suyo.
 *
 * Compara por etiquetas completas: `notune.cu` no coincide con `une.cu`.
 */
export function matchesDomainOrSubdomain(
  site: string,
  pattern: string,
): boolean {
  const normalized = pattern.trim().toLowerCase().replace(/^\./, "");
  if (normalized.length === 0) return false;

  return site === normalized || site.endsWith(`.${normalized}`);
}

export type SiteScope = "national" | "international";

/**
 * Nacional = TLD `.cu`, menos los dominios institucionales excluidos.
 */
export function isNationalSite(
  site: string,
  exclusions: readonly string[] = [],
): boolean {
  const normalized = site.trim().toLowerCase();
  if (normalized !== "cu" && !normalized.endsWith(".cu")) return false;

  return !exclusions.some((pattern) => matchesDomainOrSubdomain(normalized, pattern));
}

export function classifySite(
  site: string,
  exclusions: readonly string[] = [],
): SiteScope {
  return isNationalSite(site, exclusions) ? "national" : "international";
}

/** `true` cuando el sitio pertenece a la lista de servidores de webmail dada. */
export function isWebmailSite(
  site: string,
  webmailDomains: readonly string[],
): boolean {
  return webmailDomains.some((pattern) => matchesDomainOrSubdomain(site, pattern));
}

const INTERNAL_DOMAIN_SUFFIXES = [
  ".local",
  ".lan",
  ".internal",
  ".home.arpa",
] as const;

function parseIpv4(site: string): number[] | null {
  const parts = site.split(".");
  if (parts.length !== 4) return null;

  const octets: number[] = [];
  for (const part of parts) {
    if (!/^\d{1,3}$/.test(part)) return null;
    const value = Number(part);
    if (value > 255) return null;
    octets.push(value);
  }

  return octets;
}

function isPrivateIpv4(site: string): boolean {
  const octets = parseIpv4(site);
  if (octets === null) return false;

  const [first, second] = octets;
  if (first === 0 || first === 10 || first === 127) return true;
  if (first === 169 && second === 254) return true;
  if (first === 172 && second >= 16 && second <= 31) return true;
  if (first === 192 && second === 168) return true;
  // CGNAT (RFC 6598): espacio compartido, no es un sitio de internet.
  if (first === 100 && second >= 64 && second <= 127) return true;

  return false;
}

function isInternalIpv6(site: string): boolean {
  if (site === "::" || site === "::1") return true;
  // fc00::/7 (ULA) y fe80::/10 (link-local).
  return /^f[cd][0-9a-f]{2}:/.test(site) || /^fe[89ab][0-9a-f]:/.test(site);
}

/**
 * `true` cuando el destino no es un sitio de internet.
 *
 * El informe mide navegación: el tráfico hacia servidores internos —por ejemplo
 * el WSUS del organismo, que en el log real aparece como `172.19.152.80:8530`—
 * no es una visita a un sitio y no debe competir por un puesto en el top 10.
 *
 * Se consideran internos:
 * - IPv4 privadas (RFC 1918), loopback, link-local, `0.0.0.0/8` y CGNAT;
 * - IPv6 loopback, ULA y link-local;
 * - nombres de una sola etiqueta (un sitio público siempre tiene TLD);
 * - dominios de uso interno (`.local`, `.lan`, `.internal`, `.home.arpa`);
 * - cualquier destino con `:` que no sea una IPv6 válida (URL malformada).
 */
export function isInternalSite(site: string): boolean {
  const normalized = site
    .trim()
    .toLowerCase()
    .replace(/^\[/, "")
    .replace(/\]$/, "");

  if (normalized.length === 0) return true;

  if (normalized.includes(":")) {
    if (!/^[0-9a-f:]+$/.test(normalized)) return true;
    return isInternalIpv6(normalized);
  }

  if (isPrivateIpv4(normalized)) return true;
  if (!normalized.includes(".")) return true;

  return INTERNAL_DOMAIN_SUFFIXES.some((suffix) =>
    normalized.endsWith(suffix),
  );
}
