import { describe, expect, it } from "vitest";
import type { DailyMetrics } from "../metrics/aggregate";
import { buildMonthlyReport, mergeDailyMetrics } from "./monthly";

function day(overrides: Partial<DailyMetrics> & { day: string }): DailyMetrics {
  return {
    totalHits: 0,
    totalBytesIn: 0,
    totalBytesOut: 0,
    totalElapsedMs: 0,
    unidentifiedHits: 0,
    users: [],
    sites: [],
    siteUsers: [],
    ...overrides,
  };
}

describe("mergeDailyMetrics", () => {
  it("suma los días y acumula usuarios, sitios y pares por separado", () => {
    const totals = mergeDailyMetrics([
      day({
        day: "2026-05-01",
        totalHits: 3,
        totalBytesIn: 300,
        totalBytesOut: 30,
        totalElapsedMs: 3_000,
        unidentifiedHits: 1,
        users: [
          {
            username: "brian",
            hits: 2,
            bytesIn: 200,
            bytesOut: 20,
            elapsedMs: 2_000,
            browsingMs: 10_000,
          },
        ],
        sites: [
          {
            site: "www.youtube.com",
            hits: 3,
            bytesIn: 300,
            bytesOut: 30,
            elapsedMs: 3_000,
            browsingMs: 12_000,
          },
        ],
        siteUsers: [
          {
            site: "www.youtube.com",
            username: "brian",
            hits: 2,
            bytesIn: 200,
            elapsedMs: 2_000,
            browsingMs: 8_000,
          },
        ],
      }),
      day({
        day: "2026-05-02",
        totalHits: 1,
        totalBytesIn: 100,
        totalBytesOut: 10,
        totalElapsedMs: 1_000,
        unidentifiedHits: 1,
        users: [
          {
            username: "brian",
            hits: 1,
            bytesIn: 100,
            bytesOut: 10,
            elapsedMs: 1_000,
            browsingMs: 5_000,
          },
        ],
        sites: [
          {
            site: "www.youtube.com",
            hits: 1,
            bytesIn: 100,
            bytesOut: 10,
            elapsedMs: 1_000,
            browsingMs: 4_000,
          },
        ],
        siteUsers: [
          {
            site: "www.youtube.com",
            username: "brian",
            hits: 1,
            bytesIn: 100,
            elapsedMs: 1_000,
            browsingMs: 3_000,
          },
        ],
      }),
    ]);

    expect(totals.totalHits).toBe(4);
    expect(totals.totalBytesIn).toBe(400);
    expect(totals.totalBytesOut).toBe(40);
    expect(totals.totalElapsedMs).toBe(4_000);
    expect(totals.unidentifiedHits).toBe(2);

    expect(totals.users).toHaveLength(1);
    expect(totals.users[0]).toMatchObject({
      username: "brian",
      hits: 3,
      browsingMs: 15_000,
    });

    expect(totals.sites).toHaveLength(1);
    expect(totals.sites[0]).toMatchObject({
      site: "www.youtube.com",
      hits: 4,
      browsingMs: 16_000,
    });

    expect(totals.siteUsers).toHaveLength(1);
    expect(totals.siteUsers[0]).toMatchObject({
      site: "www.youtube.com",
      username: "brian",
      hits: 3,
      browsingMs: 11_000,
    });
  });

  it("rechaza el mismo día dos veces en vez de duplicar métricas", () => {
    expect(() =>
      mergeDailyMetrics([
        day({ day: "2026-05-01", totalHits: 1 }),
        day({ day: "2026-05-01", totalHits: 1 }),
      ]),
    ).toThrow(/importado dos veces/);
  });

  it("no mezcla la cuenta sin identificar con una cuenta real", () => {
    const totals = mergeDailyMetrics([
      day({
        day: "2026-05-01",
        users: [
          {
            username: null,
            hits: 5,
            bytesIn: 0,
            bytesOut: 0,
            elapsedMs: 0,
            browsingMs: 0,
          },
        ],
      }),
    ]);

    expect(totals.users[0].username).toBeNull();
  });
});

describe("buildMonthlyReport", () => {
  const daily = [
    day({
      day: "2026-05-01",
      totalHits: 100,
      unidentifiedHits: 10,
      users: [
        {
          username: "brian",
          hits: 100,
          bytesIn: 1_048_576,
          bytesOut: 0,
          elapsedMs: 60_000,
          browsingMs: 3_600_000,
        },
      ],
      sites: [
        {
          site: "www.youtube.com",
          hits: 100,
          bytesIn: 1_048_576,
          bytesOut: 0,
          elapsedMs: 60_000,
          browsingMs: 3_600_000,
        },
      ],
      siteUsers: [
        {
          site: "www.youtube.com",
          username: "brian",
          hits: 100,
          bytesIn: 1_048_576,
          elapsedMs: 60_000,
          browsingMs: 3_600_000,
        },
      ],
    }),
  ];

  it("declara los días faltantes del período", () => {
    const report = buildMonthlyReport({
      year: 2026,
      month: 5,
      daily,
    });

    expect(report.period.days).toHaveLength(31);
    expect(report.coverage.presentDays).toBe(1);
    expect(report.coverage.missingDays).toHaveLength(30);
    expect(report.declarations.incompleteCoverage).toBe(true);
  });

  it("reporta el día ajeno al período sin sumarlo", () => {
    const report = buildMonthlyReport({
      year: 2026,
      month: 5,
      daily: [
        ...daily,
        day({
          day: "2026-04-30",
          totalHits: 900,
          users: [
            {
              username: "brian",
              hits: 900,
              bytesIn: 0,
              bytesOut: 0,
              elapsedMs: 0,
              browsingMs: 0,
            },
          ],
        }),
      ],
    });

    expect(report.coverage.extraDays).toEqual(["2026-04-30"]);
    expect(report.totals.totalHits).toBe(100);
    expect(report.totals.users[0].hits).toBe(100);
  });

  it("declara los hits sin cuenta identificada", () => {
    const report = buildMonthlyReport({
      year: 2026,
      month: 5,
      daily,
    });

    expect(report.coverage.unidentifiedHits).toBe(10);
  });

  it("calcula las dos tablas y ata el drill-down a la tabla internacional", () => {
    const report = buildMonthlyReport({
      year: 2026,
      month: 5,
      daily,
    });

    expect(report.traces.internationalSites.map((row) => row.site)).toEqual([
      "www.youtube.com",
    ]);
    expect(report.traces.siteDrilldowns.map((drilldown) => drilldown.site)).toEqual([
      "www.youtube.com",
    ]);
    expect(report.traces.siteDrilldowns[0].rows[0]).toMatchObject({
      username: "brian",
      hits: "100",
      browsingTime: "01:00:00",
    });
  });

  it("declara el Browsing Time como aproximación hasta que se calibre", () => {
    const approximate = buildMonthlyReport({
      year: 2026,
      month: 5,
      daily,
    });
    const calibrated = buildMonthlyReport({
      year: 2026,
      month: 5,
      daily,
      browsingTimeCalibrated: true,
    });

    expect(approximate.declarations.browsingTimeApproximate).toBe(true);
    expect(calibrated.declarations.browsingTimeApproximate).toBe(false);
  });
});
