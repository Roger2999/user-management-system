import { describe, expect, it } from "vitest";
import type { SquidLogRecord } from "../types";
import { DailyMetricsAccumulator, UNKNOWN_SITE } from "./aggregate";

const MINUTE = 60 * 1000;

function record(overrides: Partial<SquidLogRecord>): SquidLogRecord {
  return {
    timestampMs: 0,
    elapsedMs: 0,
    clientIp: "10.0.0.1",
    squidStatus: "TCP_MISS",
    httpStatus: 200,
    bytes: 0,
    method: "GET",
    url: "http://www.youtube.com/watch",
    username: null,
    hierarchy: "DIRECT",
    contentType: "text/html",
    ...overrides,
  };
}

describe("DailyMetricsAccumulator", () => {
  it("acumula totales por usuario y por sitio", () => {
    const accumulator = new DailyMetricsAccumulator("2026-05-01");

    accumulator.add(
      record({ username: "u1", bytes: 1024, elapsedMs: 100, timestampMs: 0 }),
    );
    accumulator.add(
      record({
        username: "u1",
        bytes: 2048,
        elapsedMs: 200,
        timestampMs: 10 * MINUTE,
      }),
    );
    accumulator.add(
      record({
        username: "u2",
        url: "http://www.facebook.com/x",
        bytes: 512,
        elapsedMs: 50,
        timestampMs: 15 * MINUTE,
      }),
    );

    const metrics = accumulator.toMetrics();

    expect(metrics.day).toBe("2026-05-01");
    expect(metrics.totalHits).toBe(3);
    expect(metrics.totalBytesIn).toBe(3584);
    expect(metrics.totalElapsedMs).toBe(350);
    expect(metrics.unidentifiedHits).toBe(0);

    expect(metrics.users).toEqual([
      {
        username: "u1",
        hits: 2,
        bytesIn: 3072,
        bytesOut: 0,
        elapsedMs: 300,
        browsingMs: 10 * MINUTE,
      },
      {
        username: "u2",
        hits: 1,
        bytesIn: 512,
        bytesOut: 0,
        elapsedMs: 50,
        browsingMs: 0,
      },
    ]);

    expect(metrics.sites.map((site) => [site.site, site.hits])).toEqual([
      ["www.youtube.com", 2],
      ["www.facebook.com", 1],
    ]);
    expect(metrics.siteUsers).toHaveLength(2);
  });

  it("corta la sesión cuando el hueco supera el umbral", () => {
    const accumulator = new DailyMetricsAccumulator("2026-05-01");

    accumulator.add(record({ username: "u1", timestampMs: 0 }));
    accumulator.add(record({ username: "u1", timestampMs: 10 * MINUTE }));
    // Hueco de 31 minutos: abre una sesión nueva, no suma.
    accumulator.add(record({ username: "u1", timestampMs: 41 * MINUTE }));
    // Hueco de 1 minuto dentro de la sesión nueva: suma.
    accumulator.add(record({ username: "u1", timestampMs: 42 * MINUTE }));

    const [user] = accumulator.toMetrics().users;

    expect(user.browsingMs).toBe(11 * MINUTE);
  });

  it("suma el tiempo de navegación por par, no por reloj de pared", () => {
    const accumulator = new DailyMetricsAccumulator("2026-05-01");

    accumulator.add(record({ username: "u1", timestampMs: 0 }));
    accumulator.add(record({ username: "u1", timestampMs: 10 * MINUTE }));
    accumulator.add(
      record({
        username: "u1",
        url: "http://www.facebook.com/x",
        timestampMs: 15 * MINUTE,
      }),
    );
    accumulator.add(
      record({
        username: "u1",
        url: "http://www.facebook.com/y",
        timestampMs: 25 * MINUTE,
      }),
    );

    const [user] = accumulator.toMetrics().users;

    // 10 min en youtube + 10 min en facebook, aunque el reloj cubra 25 min.
    expect(user.browsingMs).toBe(20 * MINUTE);
  });

  it("separa las subidas y cuenta los hits sin cuenta identificada", () => {
    const accumulator = new DailyMetricsAccumulator("2026-05-01");

    accumulator.add(
      record({ username: "u1", method: "POST", bytes: 5000, timestampMs: 0 }),
    );
    accumulator.add(
      record({
        username: null,
        url: "http://www.bing.com/x",
        timestampMs: 1000,
      }),
    );

    const metrics = accumulator.toMetrics();

    expect(metrics.totalBytesOut).toBe(5000);
    expect(metrics.unidentifiedHits).toBe(1);
    expect(metrics.users.map((user) => user.username)).toEqual([
      "u1",
      null,
    ]);
    expect(metrics.users[0].bytesOut).toBe(5000);
  });

  it("agrupa bajo un sitio conocido las URLs que no se pueden interpretar", () => {
    const accumulator = new DailyMetricsAccumulator("2026-05-01");

    accumulator.add(record({ username: "u1", url: "texto con espacios" }));

    expect(accumulator.toMetrics().sites[0].site).toBe(UNKNOWN_SITE);
  });

  it("ignora los registros fuera de orden sin romper el acumulador", () => {
    const accumulator = new DailyMetricsAccumulator("2026-05-01");

    accumulator.add(record({ username: "u1", timestampMs: 10 * MINUTE }));
    accumulator.add(record({ username: "u1", timestampMs: 0 }));

    expect(accumulator.toMetrics().users[0].browsingMs).toBe(0);
  });
});
