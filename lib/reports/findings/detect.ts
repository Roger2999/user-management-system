import type { DailyMetrics } from "../metrics/aggregate";
import { findMatchingRules, type CategoryRule } from "../rules/matcher";

/**
 * Detección de las categorías prohibidas del informe (S5).
 *
 * La evidencia se arma desde lo que quedó persistido: un par (sitio, usuario)
 * por día. Por eso la granularidad de `firstSeen`/`lastSeen` es el día, no el
 * segundo: el informe declara desde cuándo y hasta cuándo se vio el acceso, no
 * el instante exacto de cada hit.
 *
 * El motor de reglas se aplica contra el **sitio** (el hostname), que es lo que
 * guarda la base. Una regla `CONTAINS` busca en ese hostname; el path completo
 * no se persiste. Es una limitación deliberada: guardar una fila por URL
 * multiplicaría la base sin que el informe use el path.
 *
 * El ancla del día es el mediodía UTC. La fecha local del informe es
 * `America/Havana` (UTC-4/-5), así que el mediodía UTC siempre cae en el mismo
 * día local y la evidencia no se corre un día al mostrarla.
 */

export type FindingCandidate = {
  categoryRuleId: string;
  site: string;
  username: string | null;
  hits: number;
  firstSeen: Date;
  lastSeen: Date;
};

const NOON_UTC = "T12:00:00.000Z";

function findingKey(
  categoryRuleId: string,
  site: string,
  username: string | null,
): string {
  return `${categoryRuleId}\u0001${site}\u0001${username ?? ""}`;
}

export function detectFindings(
  days: readonly DailyMetrics[],
  rules: readonly CategoryRule[],
): FindingCandidate[] {
  const activeRules = rules.filter((rule) => rule.active);
  if (activeRules.length === 0) return [];

  const found = new Map<string, FindingCandidate>();

  for (const day of days) {
    const seenOn = new Date(`${day.day}${NOON_UTC}`);

    for (const pair of day.siteUsers) {
      if (pair.hits <= 0) continue;

      for (const rule of findMatchingRules(pair.site, pair.site, activeRules)) {
        const key = findingKey(rule.id, pair.site, pair.username);
        const current = found.get(key);

        if (current === undefined) {
          found.set(key, {
            categoryRuleId: rule.id,
            site: pair.site,
            username: pair.username,
            hits: pair.hits,
            firstSeen: seenOn,
            lastSeen: seenOn,
          });
          continue;
        }

        current.hits += pair.hits;
        if (seenOn < current.firstSeen) current.firstSeen = seenOn;
        if (seenOn > current.lastSeen) current.lastSeen = seenOn;
      }
    }
  }

  return [...found.values()].sort(
    (a, b) =>
      a.site.localeCompare(b.site) ||
      (a.username ?? "").localeCompare(b.username ?? "") ||
      a.categoryRuleId.localeCompare(b.categoryRuleId),
  );
}
