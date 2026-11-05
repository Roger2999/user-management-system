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
  it("usa 5 minutos como umbral de sesión por defecto", () => {
    const accumulator = new DailyMetricsAccumulator("2026-05-01");

    accumulator.add(record({ username: "u1", timestampMs: 0 }));
    accumulator.add(record({ username: "u1", timestampMs: 5 * MINUTE }));
    accumulator.add(record({ username: "u1", timestampMs: 11 * MINUTE }));

    const [user] = accumulator.toMetrics().users;

    // 5 min entra (≤ umbral), 6 min corta: la sesión vale 5 min, no 11.
    expect(user.browsingMs).toBe(5 * MINUTE);
  });

  it("acumula totales por usuario y por sitio", () => {
    const accumulator = new DailyMetricsAccumulator("2026-05-01", {
      browsingGapMs: 30 * MINUTE,
    });

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
    const accumulator = new DailyMetricsAccumulator("2026-05-01", {
      browsingGapMs: 30 * MINUTE,
    });

    accumulator.add(record({ username: "u1", timestampMs: 0 }));
    accumulator.add(record({ username: "u1", timestampMs: 10 * MINUTE }));
    // Hueco de 31 minutos: abre una sesión nueva, no suma.
    accumulator.add(record({ username: "u1", timestampMs: 41 * MINUTE }));
    // Hueco de 1 minuto dentro de la sesión nueva: suma.
    accumulator.add(record({ username: "u1", timestampMs: 42 * MINUTE }));

    const [user] = accumulator.toMetrics().users;

    expect(user.browsingMs).toBe(11 * MINUTE);
  });

  it("no deriva el Browsing Time del usuario sumando sus pares (sitio, usuario)", () => {
    const accumulator = new DailyMetricsAccumulator("2026-05-01", {
      browsingGapMs: 30 * MINUTE,
    });

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

    const metrics = accumulator.toMetrics();
    const [user] = metrics.users;
    const sumaDePares = metrics.siteUsers.reduce(
      (total, par) => total + par.browsingMs,
      0,
    );

    // El reloj del usuario ve 0, 10, 15, 25: suma 25 min. Sus dos pares suman
    // 10 + 10 = 20: las sesiones de sitios distintos se solapan.
    expect(user.browsingMs).toBe(25 * MINUTE);
    expect(sumaDePares).toBe(20 * MINUTE);
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
    const accumulator = new DailyMetricsAccumulator("2026-05-01", {
      browsingGapMs: 30 * MINUTE,
    });

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

  it("aplica el mismo umbral al reloj del sitio y al del usuario", () => {
    const accumulator = new DailyMetricsAccumulator("2026-05-01", {
      browsingGapMs: 4 * MINUTE,
    });

    accumulator.add(record({ username: "u1", timestampMs: 0 }));
    accumulator.add(record({ username: "u1", timestampMs: 5 * MINUTE }));

    const metrics = accumulator.toMetrics();

    // Un solo umbral: el hueco de 5 min corta en los tres relojes.
    expect(metrics.sites[0].browsingMs).toBe(0);
    expect(metrics.siteUsers[0].browsingMs).toBe(0);
    expect(metrics.users[0].browsingMs).toBe(0);
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
    expect(accumulator.toSkipped()).toEqual({
      unserved: 4,
      internal: 0,
      telemetry: 0,
    });
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
    expect(accumulator.toSkipped()).toEqual({
      unserved: 0,
      internal: 4,
      telemetry: 0,
    });
  });

  it("cuenta la telemetría en los totales y la excluye de las tablas de sitios", () => {
    const accumulator = new DailyMetricsAccumulator("2026-05-01");

    accumulator.add(
      record({
        username: "u1",
        url: "http://firefox-portal-detection.com/x",
        bytes: 100,
      }),
    );
    accumulator.add(
      record({ username: "u1", url: "http://6734a28b.otlp.bugsnag.com/x" }),
    );
    accumulator.add(
      record({ username: "u1", url: "http://watson.microsoft.com/x" }),
    );
    accumulator.add(
      record({
        username: "u1",
        url: "http://cp801.prod.do.dsp.mp.microsoft.com/x",
      }),
    );
    accumulator.add(
      record({ username: "u1", url: "http://ad.doubleclick.net/x" }),
    );
    accumulator.add(
      record({ username: "u1", url: "http://ctldl.windowsupdate.com/x" }),
    );
    accumulator.add(
      record({ username: "u1", url: "http://www.youtube.com/watch" }),
    );

    const metrics = accumulator.toMetrics();

    // Hits y bytes incluyen la telemetría: es tráfico servido y es el
    // denominador real de `% of Hits` (S26).
    expect(metrics.totalHits).toBe(7);
    expect(metrics.totalBytesIn).toBe(100);
    expect(metrics.users[0].hits).toBe(7);

    // Las tablas de sitios no la muestran, pero la fila existe marcada.
    expect(metrics.sites.filter((site) => !site.telemetry)).toEqual([
      expect.objectContaining({ site: "www.youtube.com", hits: 1 }),
    ]);
    expect(metrics.sites.filter((site) => site.telemetry)).toHaveLength(6);
    expect(accumulator.toSkipped()).toEqual({
      unserved: 0,
      internal: 0,
      telemetry: 6,
    });
  });

  it("permite reemplazar la lista de telemetría", () => {
    const accumulator = new DailyMetricsAccumulator("2026-05-01", {
      telemetryPatterns: ["vendor.com"],
    });

    accumulator.add(
      record({ username: "u1", url: "http://telemetry.vendor.com/x" }),
    );
    accumulator.add(
      record({
        username: "u1",
        url: "http://firefox-portal-detection.com/x",
      }),
    );

    const metrics = accumulator.toMetrics();

    expect(metrics.totalHits).toBe(2);
    expect(
      metrics.sites.filter((site) => !site.telemetry).map((site) => site.site),
    ).toEqual(["firefox-portal-detection.com"]);
    expect(accumulator.toSkipped().telemetry).toBe(1);
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
    expect(accumulator.toSkipped()).toEqual({
      unserved: 0,
      internal: 0,
      telemetry: 0,
    });
  });

  it("ignora los registros fuera de orden sin romper el acumulador", () => {
    const accumulator = new DailyMetricsAccumulator("2026-05-01");

    accumulator.add(record({ username: "u1", timestampMs: 10 * MINUTE }));
    accumulator.add(record({ username: "u1", timestampMs: 0 }));

    expect(accumulator.toMetrics().users[0].browsingMs).toBe(0);
  });
});
