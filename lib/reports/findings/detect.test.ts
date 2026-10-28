import { describe, expect, it } from "vitest";
import type { DailyMetrics } from "../metrics/aggregate";
import type { CategoryRule } from "../rules/matcher";
import { detectFindings } from "./detect";

function day(overrides: Partial<DailyMetrics> & { day: string }): DailyMetrics {
  return {
    totalHits: 0,
    totalBytesIn: 0,
    totalBytesOut: 0,
    totalElapsedMs: 0,
    unidentifiedHits: 0,
    skipped: { unserved: 0, internal: 0, telemetry: 0 },
    users: [],
    sites: [],
    siteUsers: [],
    ...overrides,
  };
}

function pair(
  site: string,
  username: string | null,
  hits: number,
): DailyMetrics["siteUsers"][number] {
  return { site, username, hits, bytesIn: 0, elapsedMs: 0, browsingMs: 0 };
}

function rule(overrides: Partial<CategoryRule>): CategoryRule {
  return {
    id: "rule-1",
    category: "ADULT",
    matchType: "SUFFIX",
    pattern: "example.com",
    active: true,
    ...overrides,
  };
}

describe("detectFindings", () => {
  it("suma los hits del par y guarda el primer y el último día", () => {
    const found = detectFindings(
      [
        day({ day: "2026-05-02", siteUsers: [pair("www.example.com", "brian", 3)] }),
        day({ day: "2026-05-01", siteUsers: [pair("www.example.com", "brian", 2)] }),
      ],
      [rule({})],
    );

    expect(found).toHaveLength(1);
    expect(found[0]).toMatchObject({
      categoryRuleId: "rule-1",
      site: "www.example.com",
      username: "brian",
      hits: 5,
    });
    expect(found[0].firstSeen).toEqual(new Date("2026-05-01T12:00:00.000Z"));
    expect(found[0].lastSeen).toEqual(new Date("2026-05-02T12:00:00.000Z"));
  });

  it("produce una evidencia por usuario y conserva el tráfico sin cuenta", () => {
    const found = detectFindings(
      [
        day({
          day: "2026-05-01",
          siteUsers: [
            pair("www.example.com", "brian", 2),
            pair("www.example.com", "yosmel", 1),
            pair("www.example.com", null, 4),
          ],
        }),
      ],
      [rule({})],
    );

    expect(
      found.map((finding) => finding.username ?? "").sort(),
    ).toEqual(["", "brian", "yosmel"]);
    expect(found.find((finding) => finding.username === null)?.hits).toBe(4);
  });

  it("aplica DOMAIN, SUFFIX y CONTAINS contra el sitio", () => {
    const rules = [
      rule({ id: "domain", matchType: "DOMAIN", pattern: "exact.com" }),
      rule({ id: "suffix", matchType: "SUFFIX", pattern: "example.com" }),
      rule({ id: "contains", matchType: "CONTAINS", pattern: "proxy" }),
    ];

    const found = detectFindings(
      [
        day({
          day: "2026-05-01",
          siteUsers: [
            pair("exact.com", "u", 1),
            pair("sub.example.com", "u", 1),
            pair("myproxy.net", "u", 1),
            pair("other.net", "u", 1),
          ],
        }),
      ],
      rules,
    );

    expect(found.map((finding) => finding.site).sort()).toEqual([
      "exact.com",
      "myproxy.net",
      "sub.example.com",
    ]);
  });

  it("ignora las reglas inactivas y no inventa hallazgos sin reglas", () => {
    const days = [day({ day: "2026-05-01", siteUsers: [pair("www.example.com", "u", 1)] })];

    expect(detectFindings(days, [rule({ active: false })])).toEqual([]);
    expect(detectFindings(days, [])).toEqual([]);
  });

  it("ignora los pares sin hits", () => {
    const found = detectFindings(
      [day({ day: "2026-05-01", siteUsers: [pair("www.example.com", "u", 0)] })],
      [rule({})],
    );

    expect(found).toEqual([]);
  });
});
