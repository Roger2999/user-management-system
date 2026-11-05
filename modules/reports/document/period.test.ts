import { describe, expect, it } from "vitest";
import { fillPeriodFields } from "./period";

const PARAGRAPH = (text: string) =>
  `<w:p><w:r><w:t>${text}</w:t></w:r></w:p>`;

/** Párrafo partido en runs como los parte Word. */
const SPLIT = (parts: string[]) =>
  `<w:p>${parts
    .map((part) => `<w:r><w:t>${part}</w:t></w:r>`)
    .join("")}</w:p>`;

const TABLE = (text: string) =>
  `<w:tbl><w:tr><w:tc>${PARAGRAPH(text)}</w:tc></w:tr></w:tbl>`;

function sample(): string {
  return [
    "<w:document><w:body>",
    SPLIT(["Informe Mensual de Ciberseguridad", "."]),
    SPLIT([
      "Entidad: Empresa Eléctrica de Matanzas",
      "Período del Informe:",
      " 2 / 11/ 2026",
    ]),
    SPLIT(["Fecha de Emisión:", " 9/ 11/ 2026"]),
    PARAGRAPH("Día del comité: ___ / ___ / 202_"),
    PARAGRAPH("otro texto intacto"),
    TABLE("Fecha de respaldo: ___/____/202_"),
    SPLIT([
      "Y para que así conste se firma la presente a los ",
      "_____ días del mes de ___________________ del año 202___",
    ]),
    "</w:body></w:document>",
  ].join("");
}

/** 3 de julio 02:00 UTC = 2 de julio 22:00 en La Habana. */
const EMISSION = Date.UTC(2026, 6, 3, 2, 0, 0);

describe("fillPeriodFields", () => {
  it("escribe el título con el mes y el año del período", () => {
    const result = fillPeriodFields(sample(), {
      month: 6,
      year: 2026,
      generatedAt: EMISSION,
    });

    expect(result).toContain(
      "Informe Mensual de Ciberseguridad. Junio 2026 v. Final.",
    );
    expect(result).not.toContain("Octubre 2026");
  });

  it("escribe el rango completo del período", () => {
    const result = fillPeriodFields(sample(), {
      month: 6,
      year: 2026,
      generatedAt: EMISSION,
    });

    expect(result).toContain("Período del Informe:");
    expect(result).toContain("01/06/2026 al 30/06/2026");
    expect(result).not.toContain("2 / 11/ 2026");
  });

  it("fecha la emisión con el día local de La Habana", () => {
    const result = fillPeriodFields(sample(), {
      month: 6,
      year: 2026,
      generatedAt: EMISSION,
    });

    expect(result).toContain("02/07/2026");
    expect(result).not.toContain("9/ 11/ 2026");
  });

  it("cierra la firma con la fecha de emisión", () => {
    const result = fillPeriodFields(sample(), {
      month: 6,
      year: 2026,
      generatedAt: EMISSION,
    });

    expect(result).toContain(
      "Y para que así conste se firma la presente a los 2 días del mes de julio del año 2026",
    );
  });

  it("completa el año de los huecos manuales, también dentro de tablas", () => {
    const result = fillPeriodFields(sample(), {
      month: 6,
      year: 2026,
      generatedAt: EMISSION,
    });

    expect(result).toContain("Día del comité: ___ / ___ / 2026");
    expect(result).toContain("Fecha de respaldo: ___/____/2026");
    expect(result).not.toContain("202_");
  });

  it("no toca otros párrafos", () => {
    const result = fillPeriodFields(sample(), {
      month: 6,
      year: 2026,
      generatedAt: EMISSION,
    });

    expect(result).toContain("otro texto intacto");
  });

  it("falla si no encuentra el título", () => {
    const xml = sample().replace("Informe Mensual de Ciberseguridad", "Resumen");

    expect(() =>
      fillPeriodFields(xml, { month: 6, year: 2026, generatedAt: EMISSION }),
    ).toThrow(/no se encontró el título/);
  });

  it("falla si no encuentra el período", () => {
    const xml = sample().replace("Período del Informe:", "Periodo:");

    expect(() =>
      fillPeriodFields(xml, { month: 6, year: 2026, generatedAt: EMISSION }),
    ).toThrow(/no se encontró el período/);
  });

  it("falla si no encuentra la fecha de emisión", () => {
    const xml = sample().replace("Fecha de Emisión:", "Emisión:");

    expect(() =>
      fillPeriodFields(xml, { month: 6, year: 2026, generatedAt: EMISSION }),
    ).toThrow(/no se encontró la fecha de emisión/);
  });

  it("falla si no encuentra el cierre", () => {
    const xml = sample().replace("Y para que así conste", "Firma");

    expect(() =>
      fillPeriodFields(xml, { month: 6, year: 2026, generatedAt: EMISSION }),
    ).toThrow(/no se encontró el cierre/);
  });

  it("rechaza un mes fuera de rango", () => {
    expect(() =>
      fillPeriodFields(sample(), { month: 13, year: 2026, generatedAt: EMISSION }),
    ).toThrow(/mes fuera de rango/);
  });
});
