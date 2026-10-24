import { matchesDomainOrSubdomain } from "../classify/site";

/**
 * Motor de reglas de las categorías prohibidas del informe.
 *
 * Se evita `regex` a propósito: un patrón mal escrito o malicioso puede colgar
 * el proceso (ReDoS) y estos patrones los edita una persona en la UI. Las tres
 * formas soportadas cubren el caso real sin abrir esa puerta.
 */

export type RuleCategory =
  | "ADULT"
  | "SUBVERSIVE"
  | "ANON_PROXY"
  | "MINING";

export type RuleMatchType = "DOMAIN" | "SUFFIX" | "CONTAINS";

export type CategoryRule = {
  id: string;
  category: RuleCategory;
  matchType: RuleMatchType;
  pattern: string;
  active: boolean;
};

export function ruleMatches(
  site: string,
  url: string,
  rule: CategoryRule,
): boolean {
  if (!rule.active) return false;

  const pattern = rule.pattern.trim().toLowerCase();
  if (pattern.length === 0) return false;

  switch (rule.matchType) {
    case "DOMAIN":
      return site === pattern;
    case "SUFFIX":
      return matchesDomainOrSubdomain(site, pattern);
    case "CONTAINS":
      return url.toLowerCase().includes(pattern);
    default:
      return false;
  }
}

/** Todas las reglas activas que coinciden con el registro. */
export function findMatchingRules(
  site: string,
  url: string,
  rules: readonly CategoryRule[],
): CategoryRule[] {
  return rules.filter((rule) => ruleMatches(site, url, rule));
}

/** Categorías afectadas, sin repetir. */
export function categoriesFor(
  site: string,
  url: string,
  rules: readonly CategoryRule[],
): RuleCategory[] {
  const categories = new Set<RuleCategory>();
  for (const rule of findMatchingRules(site, url, rules)) {
    categories.add(rule.category);
  }
  return [...categories];
}
