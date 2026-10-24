import { describe, expect, it } from "vitest";
import { daysInMonth, toLocalDay } from "./time";

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
