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
