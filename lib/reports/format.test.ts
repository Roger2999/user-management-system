import { describe, expect, it } from "vitest";
import {
  formatDuration,
  formatInteger,
  formatMegabytes,
  formatPercentage,
} from "./format";

describe("formatInteger", () => {
  it("separa miles con coma, como el informe vigente", () => {
    expect(formatInteger(129351)).toBe("129,351");
    expect(formatInteger(250426)).toBe("250,426");
  });

  it("no agrega separador a números de menos de cuatro cifras", () => {
    expect(formatInteger(734)).toBe("734");
    expect(formatInteger(0)).toBe("0");
  });

  it("devuelve 0 ante un valor no finito", () => {
    expect(formatInteger(Number.NaN)).toBe("0");
  });
});

describe("formatMegabytes", () => {
  it("usa dos decimales y separador de miles", () => {
    expect(formatMegabytes(Math.round(3676.86 * 1024 * 1024))).toBe("3,676.86");
    expect(formatMegabytes(Math.round(47321.1 * 1024 * 1024))).toBe(
      "47,321.10",
    );
  });

  it("formatea un megabyte exacto", () => {
    expect(formatMegabytes(1024 * 1024)).toBe("1.00");
  });

  it("formatea cero", () => {
    expect(formatMegabytes(0)).toBe("0.00");
  });
});

describe("formatDuration", () => {
  it("no limita las horas a 24, porque acumula un mes", () => {
    expect(formatDuration((699 * 3600 + 52 * 60 + 18) * 1000)).toBe(
      "699:52:18",
    );
  });

  it("rellena con ceros a la izquierda", () => {
    expect(formatDuration((2 * 3600 + 42 * 60 + 28) * 1000)).toBe("02:42:28");
    expect(formatDuration(0)).toBe("00:00:00");
  });

  it("devuelve cero ante un valor negativo o no finito", () => {
    expect(formatDuration(-1000)).toBe("00:00:00");
    expect(formatDuration(Number.NaN)).toBe("00:00:00");
  });
});

describe("formatPercentage", () => {
  it("usa un decimal, que es lo que muestra el documento", () => {
    expect(formatPercentage(129351, 129351000)).toBe("0.1%");
    expect(formatPercentage(930, 2000)).toBe("46.5%");
  });

  it("redondea los valores chicos a 0.0%", () => {
    expect(formatPercentage(4, 129351000)).toBe("0.0%");
  });

  it("devuelve 0.0% cuando el total no es positivo", () => {
    expect(formatPercentage(10, 0)).toBe("0.0%");
    expect(formatPercentage(0, 0)).toBe("0.0%");
  });
});
