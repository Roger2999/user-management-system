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

  it("no deriva el Browsing Time del sitio sumando sus usuarios", () => {
    const accumulator = new DailyMetricsAccumulator("2026-05-01");

    accumulator.add(record({ username: "u1", timestampMs: 0 }));
    accumulator.add(record({ username: "u2", timestampMs: 5 * MINUTE }));
    accumulator.add(record({ username: "u1", timestampMs: 10 * MINUTE }));
    accumulator.add(record({ username: "u2", timestampMs: 15 * MINUTE }));
    accumulator.add(record({ username: "u1", timestampMs: 20 * MINUTE }));

    const metrics = accumulator.toMetrics();
    const site = metrics.sites[0];
    const sumaLosPares = metrics.siteUsers.reduce(
      (total, par) => total + par.browsingMs,
      0,
    );

    // El reloj del sitio (0, 5, 10, 15, 20) suma 20 min; los relojes de cada
    // usuario suman 20 + 10 = 30 min. Son dos métricas distintas: los pares se
    // solapan en el tiempo y el sitio no.
    expect(site.browsingMs).toBe(20 * MINUTE);
    expect(sumaLosPares).toBe(30 * MINUTE);
  });

  it("usa su propio umbral para el reloj del sitio", () => {
    const accumulator = new DailyMetricsAccumulator("2026-05-01", {
      browsingGapMs: 30 * MINUTE,
      siteBrowsingGapMs: 4 * MINUTE,
    });

    accumulator.add(record({ username: "u1", timestampMs: 0 }));
    accumulator.add(record({ username: "u1", timestampMs: 5 * MINUTE }));

    const metrics = accumulator.toMetrics();

    // El mismo hueco de 5 min: el umbral del sitio lo corta, el del par lo acepta.
    expect(metrics.sites[0].browsingMs).toBe(0);
    expect(metrics.siteUsers[0].browsingMs).toBe(5 * MINUTE);
    expect(metrics.users[0].browsingMs).toBe(5 * MINUTE);
  });

  it("no cuenta como hit lo que el sitio no sirvió", () => {
    const accumulator = new DailyMetricsAccumulator("2026-05-01");

    accumulator.add(record({ username: "u1", httpStatus: 407 }));
    accumulator.add(record({ username: "u1", httpStatus: 403 }));
    accumulator.add(record({ username: "u1", httpStatus: 500 }));
    accumulator.add(record({ username: "u1", httpStatus: null }));

    const metrics = accumulator.toMetrics();

    expect(metrics.totalHits).toBe(0);
    expect(metrics.sites).toEqual([]);
    expect(accumulator.toSkipped()).toEqual({ unserved: 4, internal: 0 });
  });

  it("no cuenta como hit una respuesta servida a un destino interno", () => {
    const accumulator = new DailyMetricsAccumulator("2026-05-01");

    accumulator.add(record({ username: "u1", url: "172.19.152.80:8530" }));
    accumulator.add(record({ username: "u1", url: "http://10.0.0.5/x" }));
    accumulator.add(
      record({ username: "u1", url: "http://update.services.local/x" }),
    );
    accumulator.add(record({ username: "u1", url: "http://srvsiscont/x" }));

    const metrics = accumulator.toMetrics();

    expect(metrics.totalHits).toBe(0);
    expect(metrics.sites).toEqual([]);
    expect(accumulator.toSkipped()).toEqual({ unserved: 0, internal: 4 });
  });

  it("cuenta las respuestas 2xx y 3xx a destinos públicos", () => {
    const accumulator = new DailyMetricsAccumulator("2026-05-01");

    accumulator.add(record({ username: "u1", httpStatus: 200 }));
    accumulator.add(
      record({
        username: "u1",
        httpStatus: 204,
        url: "http://telemetry.vendor.com/ping",
      }),
    );
    accumulator.add(
      record({
        username: "u1",
        httpStatus: 304,
        url: "http://cdn.example.com/x",
      }),
    );

    expect(accumulator.toMetrics().totalHits).toBe(3);
    expect(accumulator.toSkipped()).toEqual({ unserved: 0, internal: 0 });
  });

  it("ignora los registros fuera de orden sin romper el acumulador", () => {
    const accumulator = new DailyMetricsAccumulator("2026-05-01");

    accumulator.add(record({ username: "u1", timestampMs: 10 * MINUTE }));
    accumulator.add(record({ username: "u1", timestampMs: 0 }));

    expect(accumulator.toMetrics().users[0].browsingMs).toBe(0);
  });
});
