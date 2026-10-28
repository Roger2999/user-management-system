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
    SPLIT(["Matanzas, ", "9", " de ", "Ma", "y", "o", " de 2026"]),
    SPLIT([
      "Informe",
      " mensual correspondiente al mes",
      " mayo",
      " de ",
      "2026",
    ]),
    SPLIT([
      "En la evaluación de las trazas del mes de",
      " Mayo",
      " no se detectaron incidencias.",
    ]),
    PARAGRAPH("otro texto intacto"),
    TABLE("Mayo dentro de una tabla"),
    "</w:body></w:document>",
  ].join("");
}

/** 3 de julio 02:00 UTC = 2 de julio 22:00 en La Habana. */
const EMISSION = Date.UTC(2026, 6, 3, 2, 0, 0);

describe("fillPeriodFields", () => {
  it("fecha el documento con el día local de La Habana", () => {
    const result = fillPeriodFields(sample(), {
      month: 6,
      year: 2026,
      generatedAt: EMISSION,
    });

    expect(result).toContain("Matanzas, 2 de Julio de 2026");
  });

  it("escribe el mes y el año del período en la línea del informe", () => {
    const result = fillPeriodFields(sample(), {
      month: 6,
      year: 2026,
      generatedAt: EMISSION,
    });

    expect(result).toContain(
      "Informe mensual correspondiente al mes junio de 2026",
    );
  });

  it("reemplaza el mes en la prosa de la sección 1", () => {
    const result = fillPeriodFields(sample(), {
      month: 6,
      year: 2026,
      generatedAt: EMISSION,
    });

    expect(result).toContain(
      "En la evaluación de las trazas del mes de Junio no se detectaron incidencias.",
    );
    expect(result).not.toContain("mes de Mayo");
  });

  it("no toca otros párrafos ni el texto dentro de tablas", () => {
    const result = fillPeriodFields(sample(), {
      month: 6,
      year: 2026,
      generatedAt: EMISSION,
    });

    expect(result).toContain("otro texto intacto");
    expect(result).toContain("Mayo dentro de una tabla");
  });

  it("falla si no encuentra la fecha del documento", () => {
    const xml = sample().replace("Matanzas,", "Ciudad,");

    expect(() =>
      fillPeriodFields(xml, { month: 6, year: 2026, generatedAt: EMISSION }),
    ).toThrow(/no se encontró la fecha/);
  });

  it("falla si no encuentra la línea del mes", () => {
    const xml = sample().replace("Informe", "Resumen");

    expect(() =>
      fillPeriodFields(xml, { month: 6, year: 2026, generatedAt: EMISSION }),
    ).toThrow(/no se encontró la línea del mes/);
  });

  it("rechaza un mes fuera de rango", () => {
    expect(() =>
      fillPeriodFields(sample(), { month: 13, year: 2026, generatedAt: EMISSION }),
    ).toThrow(/mes fuera de rango/);
  });
});
