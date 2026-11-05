import { describe, expect, it } from "vitest";
import type { DailyMetrics } from "../metrics/aggregate";
import { collectUsernames, toDailyStatRows } from "./rows";

function day(overrides: Partial<DailyMetrics> = {}): DailyMetrics {
  return {
    day: "2026-06-01",
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

describe("toDailyStatRows", () => {
  it("conserva todos los pares de un sitio, sin recortar a diez", () => {
    const users = Array.from({ length: 12 }, (_unused, index) => ({
      username: `user${index}`,
      hits: 1,
      bytesIn: 10,
      bytesOut: 0,
      elapsedMs: 1,
      browsingMs: 1,
    }));

    const rows = toDailyStatRows([
      day({
        users,
        siteUsers: users.map((user) => ({
          site: "www.example.com",
          username: user.username,
          hits: 1,
          bytesIn: 10,
          elapsedMs: 1,
          browsingMs: 1,
        })),
      }),
    ]);

    expect(rows.users).toHaveLength(12);
    expect(rows.siteUsers).toHaveLength(12);
  });

  it("no escribe el par sin cuenta, pero conserva el sitio", () => {
    const rows = toDailyStatRows([
      day({
        sites: [
          {
            site: "cdn.example.com",
            hits: 1,
            bytesIn: 500,
            bytesOut: 0,
            elapsedMs: 100,
            browsingMs: 0,
            telemetry: false,
          },
        ],
        users: [
          {
            username: null,
            hits: 1,
            bytesIn: 500,
            bytesOut: 0,
            elapsedMs: 100,
            browsingMs: 0,
          },
        ],
        siteUsers: [
          {
            site: "cdn.example.com",
            username: null,
            hits: 1,
            bytesIn: 500,
            elapsedMs: 100,
            browsingMs: 0,
          },
        ],
      }),
    ]);

    expect(rows.sites).toHaveLength(1);
    expect(rows.users).toEqual([]);
    expect(rows.siteUsers).toEqual([]);
  });
});

describe("collectUsernames", () => {
  it("deduplica y ordena las cuentas de todos los días", () => {
    const names = collectUsernames([
      day({
        users: [
          { username: "zoe", hits: 1, bytesIn: 0, bytesOut: 0, elapsedMs: 0, browsingMs: 0 },
          { username: "ana", hits: 1, bytesIn: 0, bytesOut: 0, elapsedMs: 0, browsingMs: 0 },
          { username: null, hits: 1, bytesIn: 0, bytesOut: 0, elapsedMs: 0, browsingMs: 0 },
        ],
      }),
      day({
        day: "2026-06-02",
        users: [
          { username: "ana", hits: 2, bytesIn: 0, bytesOut: 0, elapsedMs: 0, browsingMs: 0 },
        ],
      }),
    ]);

    expect(names).toEqual(["ana", "zoe"]);
  });
});
