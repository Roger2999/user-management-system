import { describe, expect, it } from "vitest";
import {
  checkCoverage,
  daysInMonth,
  monthlyPeriod,
  toLocalDay,
} from "./time";

describe("toLocalDay", () => {
  it("corta el día en la zona local, no en UTC", () => {
    // 03:00 UTC del 1 de mayo son las 23:00 del 30 de abril en La Habana.
    expect(toLocalDay(Date.parse("2026-05-01T03:00:00Z"))).toBe("2026-04-30");
  });

  it("ubica correctamente el primer instante del mes local", () => {
    // 05:00 UTC del 1 de mayo son las 01:00 del 1 de mayo en La Habana.
    expect(toLocalDay(Date.parse("2026-05-01T05:00:00Z"))).toBe("2026-05-01");
  });

  it("respeta el horario de invierno", () => {
    expect(toLocalDay(Date.parse("2026-01-15T12:00:00Z"))).toBe("2026-01-15");
  });

  it("acepta una zona explícita distinta de la local", () => {
    expect(toLocalDay(Date.parse("2026-05-01T03:00:00Z"), "UTC")).toBe(
      "2026-05-01",
    );
  });
});

describe("daysInMonth", () => {
  it("devuelve los días del mes", () => {
    expect(daysInMonth(2026, 5)).toBe(31);
    expect(daysInMonth(2026, 4)).toBe(30);
  });

  it("considera los años bisiestos", () => {
    expect(daysInMonth(2024, 2)).toBe(29);
    expect(daysInMonth(2026, 2)).toBe(28);
  });
});

describe("monthlyPeriod", () => {
  it("declara el mes calendario completo", () => {
    const period = monthlyPeriod(2026, 5);

    expect(period.startDay).toBe("2026-05-01");
    expect(period.endDay).toBe("2026-05-31");
    expect(period.days).toHaveLength(31);
    expect(period.days[0]).toBe("2026-05-01");
    expect(period.days[30]).toBe("2026-05-31");
  });

  it("cierra el mes corto en el último día real", () => {
    expect(monthlyPeriod(2028, 2).endDay).toBe("2028-02-29");
    expect(monthlyPeriod(2026, 2).days).toHaveLength(28);
  });

  it("rechaza un mes fuera de rango", () => {
    expect(() => monthlyPeriod(2026, 13)).toThrow(RangeError);
    expect(() => monthlyPeriod(2026, 0)).toThrow(RangeError);
  });
});

describe("checkCoverage", () => {
  it("señala el día que falta en lugar de encoger el informe", () => {
    const period = monthlyPeriod(2026, 5);
    const present = period.days.filter((day) => day !== "2026-05-04");

    const coverage = checkCoverage(period, present);

    expect(coverage.expectedDays).toBe(31);
    expect(coverage.presentDays).toBe(30);
    expect(coverage.missingDays).toEqual(["2026-05-04"]);
  });

  it("señala el 30 de abril como día fuera del período", () => {
    const period = monthlyPeriod(2026, 5);
    const coverage = checkCoverage(period, [...period.days, "2026-04-30"]);

    expect(coverage.missingDays).toEqual([]);
    expect(coverage.extraDays).toEqual(["2026-04-30"]);
  });
});
