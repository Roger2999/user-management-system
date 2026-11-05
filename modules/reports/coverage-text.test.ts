import { describe, expect, it } from "vitest";
import { coverageSummary } from "./coverage-text";

const COMPLETE = {
  expectedDays: 31,
  presentDays: 31,
  missingDays: [],
  extraDays: [],
};

describe("coverageSummary", () => {
  it("declara cobertura completa", () => {
    expect(coverageSummary(COMPLETE)).toEqual({
      headline: "31 de 31 días cargados",
      detail: "Cobertura completa.",
      extra: null,
      complete: true,
    });
  });

  it("nombra el único día faltante", () => {
    const summary = coverageSummary({
      ...COMPLETE,
      presentDays: 30,
      missingDays: ["2026-10-31"],
    });

    expect(summary.headline).toBe("30 de 31 días cargados");
    expect(summary.detail).toBe("Falta el día 31.");
    expect(summary.complete).toBe(false);
  });

  it("comprime dos días consecutivos", () => {
    const summary = coverageSummary({
      ...COMPLETE,
      presentDays: 29,
      missingDays: ["2026-10-30", "2026-10-31"],
    });

    expect(summary.detail).toBe("Faltan los días 30–31.");
  });

  it("comprime un tramo completo", () => {
    const summary = coverageSummary({
      ...COMPLETE,
      presentDays: 28,
      missingDays: ["2026-10-29", "2026-10-30", "2026-10-31"],
    });

    expect(summary.detail).toBe("Faltan los días 29–31.");
  });

  it("separa dos tramos y un día suelto", () => {
    const summary = coverageSummary({
      ...COMPLETE,
      presentDays: 15,
      missingDays: [
        "2026-10-01",
        "2026-10-02",
        "2026-10-03",
        "2026-10-08",
        "2026-10-28",
        "2026-10-29",
        "2026-10-30",
        "2026-10-31",
      ],
    });

    expect(summary.detail).toBe("Faltan los días 1–3, 8 y 28–31.");
  });

  it("declara los días fuera del período", () => {
    const summary = coverageSummary({
      ...COMPLETE,
      extraDays: ["2026-09-30"],
    });

    expect(summary.extra).toBe("Fuera del período (no se suman): 2026-09-30.");
  });

  it("usa singular con un solo día esperado", () => {
    const summary = coverageSummary({
      expectedDays: 1,
      presentDays: 1,
      missingDays: [],
      extraDays: [],
    });

    expect(summary.headline).toBe("1 de 1 día cargado");
  });
});
