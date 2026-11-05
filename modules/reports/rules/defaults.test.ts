import { describe, expect, it } from "vitest";
import { DEFAULT_CATEGORY_RULES } from "./defaults";
import { ruleMatches, type CategoryRule } from "./matcher";

function asRule(
  entry: (typeof DEFAULT_CATEGORY_RULES)[number],
  index: number,
): CategoryRule {
  return { id: `r${index}`, active: true, ...entry };
}

describe("DEFAULT_CATEGORY_RULES", () => {
  it("no repite la misma regla", () => {
    const keys = DEFAULT_CATEGORY_RULES.map(
      (rule) => `${rule.category}|${rule.matchType}|${rule.pattern}`,
    );

    expect(new Set(keys).size).toBe(keys.length);
  });

  it("usa patrones de hostname en minúsculas y sin comodines", () => {
    for (const rule of DEFAULT_CATEGORY_RULES) {
      expect(rule.pattern).toBe(rule.pattern.trim().toLowerCase());
      expect(rule.pattern).not.toBe("");
      expect(rule.pattern.startsWith("*.")).toBe(false);
      expect(rule.pattern).not.toMatch(/[\s/]/);
      // Un TLD suelto como "com" convertiría media Internet en hallazgo.
      expect(rule.pattern).toContain(".");
    }
  });

  it("deja SUBVERSIVE sin patrones a propósito", () => {
    // La lista de sitios políticos la define el especialista, no el seed.
    // Si algún día se carga, este test debe cambiar de forma deliberada.
    expect(
      DEFAULT_CATEGORY_RULES.filter((rule) => rule.category === "SUBVERSIVE"),
    ).toEqual([]);
  });

  it("cubre las otras tres categorías", () => {
    for (const category of ["ADULT", "ANON_PROXY", "MINING"] as const) {
      expect(
        DEFAULT_CATEGORY_RULES.some((rule) => rule.category === category),
      ).toBe(true);
    }
  });

  it("reconoce subdominios de un patrón cargado", () => {
    const index = DEFAULT_CATEGORY_RULES.findIndex(
      (rule) => rule.pattern === "pornhub.com",
    );
    expect(index).toBeGreaterThanOrEqual(0);

    const target = asRule(DEFAULT_CATEGORY_RULES[index], index);

    expect(ruleMatches("www.pornhub.com", "https://www.pornhub.com", target)).toBe(
      true,
    );
    expect(ruleMatches("notpornhub.com", "https://notpornhub.com", target)).toBe(
      false,
    );
  });
});
