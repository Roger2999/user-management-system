import { describe, expect, it } from "vitest";
import type { SquidLogRecord } from "../types";
import {
  calibrateBrowsingGap,
  exactCandidates,
  type CalibrationTarget,
} from "./calibrate";

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
    username: "u1",
    hierarchy: "DIRECT",
    contentType: "text/html",
    ...overrides,
  };
}

/** 12:00 UTC del 1 de mayo: mismo día local en La Habana. */
const BASE = Date.parse("2026-05-01T12:00:00Z");

function target(browsingMs: number): CalibrationTarget[] {
  return [{ site: "www.youtube.com", username: "u1", browsingMs }];
}

describe("calibrateBrowsingGap", () => {
  it("encuentra los umbrales que reproducen el tiempo publicado", () => {
    // Huecos de 20, 30 y 45 minutos.
    const records = [
      record({ timestampMs: BASE }),
      record({ timestampMs: BASE + 20 * MINUTE }),
      record({ timestampMs: BASE + 50 * MINUTE }),
      record({ timestampMs: BASE + 95 * MINUTE }),
    ];

    // Objetivo calculado con un umbral de 30 minutos: 20 + 30 = 50.
    const results = calibrateBrowsingGap(records, target(50 * MINUTE), [
      29 * MINUTE,
      30 * MINUTE,
      40 * MINUTE,
      60 * MINUTE,
    ]);

    expect(results[0].errorMs).toBe(0);

    // 30 y 40 no se distinguen con esta muestra: el hueco de 45 queda fuera de
    // los dos y el de 30 entra en los dos. El umbral exacto no es identificable,
    // el rango sí.
    expect(exactCandidates(results).map((result) => result.gapMs)).toEqual([
      30 * MINUTE,
      40 * MINUTE,
    ]);

    expect(results.find((result) => result.gapMs === 60 * MINUTE)?.errorMs).toBe(
      45 * MINUTE,
    );
  });

  it("corta el tiempo en el cambio de día local", () => {
    // 23:50 del 1 de mayo y 00:10 del 2 en La Habana, 20 minutos de hueco real
    // pero en días distintos: no se acumula.
    const records = [
      record({ timestampMs: Date.parse("2026-05-02T03:50:00Z") }),
      record({ timestampMs: Date.parse("2026-05-02T04:10:00Z") }),
    ];

    const results = calibrateBrowsingGap(records, target(0), [30 * MINUTE]);

    expect(results[0].errorMs).toBe(0);
    expect(results[0].exactPairs).toBe(1);
  });

  it("ignora los pares sin cuenta identificada", () => {
    const records = [
      record({ username: null, timestampMs: BASE }),
      record({ username: null, timestampMs: BASE + 10 * MINUTE }),
    ];

    const results = calibrateBrowsingGap(records, target(0), [30 * MINUTE]);

    // El par sin cuenta no entra en el cálculo: el objetivo sigue en cero.
    expect(results[0].exactPairs).toBe(1);
    expect(results[0].pairs).toBe(1);
  });
});
