import { describe, expect, it } from "vitest";
import { monthlyPeriod } from "../time";
import {
  buildDeclarationText,
  emitDeclaration,
  formatDayList,
  type DeclarationInput,
} from "./declarations";

const MAY = monthlyPeriod(2026, 5);

function input(overrides: Partial<DeclarationInput> = {}): DeclarationInput {
  return {
    period: MAY,
    coverage: {
      expectedDays: 31,
      presentDays: 31,
      missingDays: [],
      extraDays: [],
      unidentifiedHits: 0,
    },
    declarations: {
      browsingTimeApproximate: false,
      incompleteCoverage: false,
      skipped: { unserved: 0, internal: 0, telemetry: 0 },
    },
    ...overrides,
  };
}

const APPROXIMATE =
  "El Browsing Time es aproximado: los relojes del proxy todavía no se calibraron contra WebSpy.";

describe("formatDayList", () => {
  it("dice el mes una sola vez cuando los días caen en el mismo mes", () => {
    expect(formatDayList(["2026-05-15"])).toBe("15 de mayo");
    expect(formatDayList(["2026-05-03", "2026-05-04"])).toBe("3 y 4 de mayo");
  });

  it("conserva el mes de un día ajeno al período", () => {
    expect(formatDayList(["2026-04-30"])).toBe("30 de abril");
  });
});

describe("buildDeclarationText", () => {
  it("declara cobertura completa sin aproximación", () => {
    expect(buildDeclarationText(input())).toBe(
      "Cobertura completa: 31 de 31 días importados.",
    );
  });

  it("declara faltantes, días ajenos, descartes y Browsing Time aproximado", () => {
    const text = buildDeclarationText(
      input({
        coverage: {
          expectedDays: 31,
          presentDays: 30,
          missingDays: ["2026-05-15"],
          extraDays: ["2026-04-30"],
          unidentifiedHits: 0,
        },
        declarations: {
          browsingTimeApproximate: true,
          incompleteCoverage: true,
          skipped: { unserved: 673982, internal: 40906, telemetry: 0 },
        },
      }),
    );

    expect(text).toBe(
      "Cobertura incompleta: 30 de 31 días importados; falta el 15 de mayo. " +
        "Se excluyó el 30 de abril por estar fuera del período. " +
        "Se descartaron 673,982 respuestas no servidas y 40,906 accesos a destinos internos. " +
        APPROXIMATE,
    );
  });

  it("enumera los faltantes cuando son pocos y los cuenta cuando son muchos", () => {
    const few = buildDeclarationText(
      input({
        coverage: {
          expectedDays: 31,
          presentDays: 29,
          missingDays: ["2026-05-03", "2026-05-04"],
          extraDays: [],
          unidentifiedHits: 0,
        },
        declarations: {
          browsingTimeApproximate: false,
          incompleteCoverage: true,
          skipped: { unserved: 0, internal: 0, telemetry: 0 },
        },
      }),
    );
    expect(few).toContain("faltan el 3 y 4 de mayo");

    const many = buildDeclarationText(
      input({
        coverage: {
          expectedDays: 30,
          presentDays: 1,
          missingDays: monthlyPeriod(2026, 6).days.slice(1),
          extraDays: [],
          unidentifiedHits: 0,
        },
        declarations: {
          browsingTimeApproximate: false,
          incompleteCoverage: true,
          skipped: { unserved: 0, internal: 0, telemetry: 0 },
        },
      }),
    );
    expect(many).toBe(
      "Cobertura incompleta: 1 de 30 días importados; faltan 29.",
    );
  });

  it("declara solo el motivo que tuvo descartes", () => {
    const text = buildDeclarationText(
      input({
        declarations: {
          browsingTimeApproximate: false,
          incompleteCoverage: false,
          skipped: { unserved: 0, internal: 40906, telemetry: 0 },
        },
      }),
    );

    expect(text).toBe(
      "Cobertura completa: 31 de 31 días importados. " +
        "Se descartaron 40,906 accesos a destinos internos.",
    );
  });

  it("incluye la telemetría en la lista de descartes", () => {
    const text = buildDeclarationText(
      input({
        declarations: {
          browsingTimeApproximate: false,
          incompleteCoverage: false,
          skipped: { unserved: 10, internal: 20, telemetry: 30 },
        },
      }),
    );

    expect(text).toBe(
      "Cobertura completa: 31 de 31 días importados. " +
        "Se descartaron 10 respuestas no servidas, 20 accesos a destinos internos y 30 accesos de telemetría.",
    );
  });
});

describe("emitDeclaration", () => {
  const ANCHOR = "Uso de correo por webmail en servidores nacionales:";

  function document(): string {
    return (
      "<w:document><w:body>" +
      "<w:p><w:r><w:t>antes</w:t></w:r></w:p>" +
      `<w:p><w:r><w:t>${ANCHOR}</w:t></w:r></w:p>` +
      "<w:p><w:r><w:t>despues</w:t></w:r></w:p>" +
      "</w:body></w:document>"
    );
  }

  it("inserta un párrafo justo antes del encabezado, con el formato del cuerpo", () => {
    const result = emitDeclaration(document(), "Cobertura completa.");

    const declaration = result.indexOf("Cobertura completa.");
    const anchor = result.indexOf(ANCHOR);

    expect(declaration).toBeGreaterThan(0);
    expect(declaration).toBeLessThan(anchor);
    expect(result).toContain('w:sz w:val="20"');
    expect(result).toContain("antes");
    expect(result).toContain("despues");
  });

  it("no agrega nada cuando no hay texto", () => {
    expect(emitDeclaration(document(), "   ")).toBe(document());
  });

  it("falla si el encabezado no existe", () => {
    const missing = () =>
      emitDeclaration("<w:document><w:body/></w:document>", "Cobertura.");

    expect(missing).toThrow(RangeError);
  });
});
