import { describe, expect, it } from "vitest";
import {
  categoriesFor,
  findMatchingRules,
  ruleMatches,
  type CategoryRule,
} from "./matcher";

function rule(overrides: Partial<CategoryRule>): CategoryRule {
  return {
    id: "r1",
    category: "ADULT",
    matchType: "DOMAIN",
    pattern: "ejemplo.com",
    active: true,
    ...overrides,
  };
}

describe("ruleMatches", () => {
  it("coincide por dominio exacto", () => {
    const target = rule({ matchType: "DOMAIN", pattern: "sitio.com" });

    expect(ruleMatches("sitio.com", "http://sitio.com/x", target)).toBe(true);
    expect(ruleMatches("sub.sitio.com", "http://sub.sitio.com/x", target)).toBe(
      false,
    );
  });

  it("coincide por sufijo de dominio", () => {
    const target = rule({ matchType: "SUFFIX", pattern: "sitio.com" });

    expect(ruleMatches("sub.sitio.com", "http://sub.sitio.com/x", target)).toBe(
      true,
    );
    expect(ruleMatches("notsitio.com", "http://notsitio.com/x", target)).toBe(
      false,
    );
  });

  it("coincide por fragmento de URL", () => {
    const target = rule({ matchType: "CONTAINS", pattern: "/proxy-gratis" });

    expect(
      ruleMatches("sitio.com", "http://sitio.com/proxy-gratis/x", target),
    ).toBe(true);
    expect(ruleMatches("sitio.com", "http://sitio.com/otro", target)).toBe(
      false,
    );
  });

  it("ignora las reglas inactivas y los patrones vacíos", () => {
    expect(
      ruleMatches("sitio.com", "http://sitio.com", rule({ active: false })),
    ).toBe(false);
    expect(
      ruleMatches("sitio.com", "http://sitio.com", rule({ pattern: "   " })),
    ).toBe(false);
  });

  it("no distingue mayúsculas", () => {
    const target = rule({ matchType: "DOMAIN", pattern: "Sitio.COM" });
    expect(ruleMatches("sitio.com", "http://sitio.com", target)).toBe(true);
  });
});

describe("findMatchingRules", () => {
  it("devuelve todas las coincidencias", () => {
    const rules = [
      rule({ id: "a", matchType: "SUFFIX", pattern: "sitio.com" }),
      rule({ id: "b", matchType: "CONTAINS", pattern: "mineria" }),
      rule({ id: "c", matchType: "DOMAIN", pattern: "otro.com" }),
    ];

    const matches = findMatchingRules(
      "sub.sitio.com",
      "http://sub.sitio.com/mineria/x",
      rules,
    );

    expect(matches.map((match) => match.id)).toEqual(["a", "b"]);
  });
});

describe("categoriesFor", () => {
  it("devuelve cada categoría una sola vez", () => {
    const rules = [
      rule({ id: "a", category: "MINING", matchType: "SUFFIX", pattern: "minero.com" }),
      rule({ id: "b", category: "MINING", matchType: "CONTAINS", pattern: "pool" }),
      rule({ id: "c", category: "ANON_PROXY", matchType: "SUFFIX", pattern: "minero.com" }),
    ];

    expect(
      categoriesFor("x.minero.com", "http://x.minero.com/pool", rules).sort(),
    ).toEqual(["ANON_PROXY", "MINING"]);
  });
});
