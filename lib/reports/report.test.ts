import { Readable } from "node:stream";
import { describe, expect, it } from "vitest";
import type { TracesSection } from "./assembly/section-traces";
import { readDocumentXml } from "./document/docx";
import { writeZip } from "./document/zip";
import { ingestSquidLog } from "./ingest";
import {
  buildMonthlyDocument,
  buildReportDocument,
} from "./report";
import { monthlyPeriod } from "./time";

const CELL = (text: string) =>
  `<w:tc><w:tcPr/><w:p><w:r><w:t>${text}</w:t></w:r></w:p></w:tc>`;
const ROW = (values: string[]) =>
  `<w:tr>${values.map(CELL).join("")}</w:tr>`;
const TABLE = (rows: string[][]) =>
  `<w:tbl><w:tblPr/><w:tblGrid>${rows[0]
    .map(() => '<w:gridCol w:w="1000"/>')
    .join("")}</w:tblGrid>${rows.map(ROW).join("")}</w:tbl>`;
const P = (text: string) => `<w:p><w:r><w:t>${text}</w:t></w:r></w:p>`;

/** Pregunta de la plantilla: `Si ____` y `No ____` en `<w:t>` separados por tab. */
const QUESTION = (prefix: string) =>
  `<w:p><w:r><w:t>${prefix} Si ____</w:t><w:tab/><w:t xml:space="preserve">No ____ </w:t></w:r></w:p>`;

const cols = (count: number, prefix: string) =>
  Array.from({ length: count }, (_value, index) => `${prefix}${index}`);

const dummy = (prefix: string) => TABLE([cols(2, `${prefix}h`), cols(2, prefix)]);
const four = (prefix: string) => TABLE([cols(4, `${prefix}h`), cols(4, prefix)]);
const seven = (prefix: string) => TABLE([cols(7, `${prefix}h`), cols(7, prefix)]);

/**
 * Documento sintético con la estructura de la plantilla v2: las tablas 6-8 son
 * las de trazas, la 9 es manual y el ancla de la declaración está antes del
 * cierre de firma.
 */
function template(): string {
  const body: string[] = [
    P("Informe Mensual de Ciberseguridad."),
    P("Entidad: Empresa Eléctrica de MatanzasPeríodo del Informe: _____"),
    P("Fecha de Emisión: _____"),
    dummy("t1"),
    dummy("t2"),
    dummy("t3"),
    seven("inc"),
    dummy("t5"),
    four("sites"),
    P("Sitios web más visitados:"),
    four("users"),
    P("Usuarios con más tiempo de navegación."),
    four("downloads"),
    P("Usuarios con más descargas."),
    TABLE([cols(2, "manual-h"), cols(2, "manual")]),
    QUESTION("Visitas a sitios de contenido pornográfico o de adultos (citas, búsqueda de parejas, eróticos)"),
    QUESTION("Visitas a sitios de malware."),
    P("Uso de correo por webmail en servidores nacionales:"),
    TABLE([cols(3, "usb-h"), cols(3, "usb")]),
    P("Día del comité: ___ / ___ / 202_"),
    P("Y para que así conste se firma la presente a los _____ días del mes de ___________________ del año 202___"),
  ];

  return `<w:document><w:body>${body.join("")}</w:body></w:document>`;
}

const siteRow = (site: string) => ({
  site,
  browsingTime: "5.00",
  users: "2",
});

const userRow = (username: string) => ({
  username,
  fullName: "Ana Pérez",
  browsingTime: "4.30",
});

const downloadRow = (username: string) => ({
  username,
  fullName: "Ana Pérez",
  downloaded: "500.00 MB",
});

const incidentRow = (url: string, measure = "") => ({
  url,
  category: "ADULT" as const,
  label: "Contenido para adultos",
  username: "ana",
  fullName: "Ana Pérez",
  position: "Analista",
  measure,
});

function traces(): TracesSection {
  return {
    topSites: [siteRow("www.internacional.com")],
    topUsers: [userRow("usuario.uno")],
    topDownloads: [downloadRow("usuario.uno")],
  };
}

function buildIncidentDoc(incidents: readonly ReturnType<typeof incidentRow>[], categories: readonly ("ADULT" | "SUBVERSIVE" | "ANON_PROXY" | "MINING" | "MALWARE")[]): string {
  return readDocumentXml(
    buildReportDocument({
      template: templateBytes(),
      traces: traces(),
      incidents,
      incidentCategories: new Set(categories),
      period: { year: 2026, month: 6 },
      generatedAt: EMISSION,
    }),
  );
}

function tableText(documentXml: string, index: number): string {
  const tables = [...documentXml.matchAll(/<w:tbl>[\s\S]*?<\/w:tbl>/g)].map(
    (match) => match[0],
  );

  return [...tables[index - 1].matchAll(/<w:t(?:\s[^>]*)?>([\s\S]*?)<\/w:t>/g)]
    .map((match) => match[1])
    .join("");
}

/** 3 de julio 02:00 UTC = 2 de julio 22:00 en La Habana. */
const EMISSION = Date.UTC(2026, 6, 3, 2, 0, 0);

function templateBytes(): Uint8Array {
  return writeZip([
    {
      name: "word/document.xml",
      data: new TextEncoder().encode(template()),
    },
  ]);
}

function build(custom: TracesSection = traces()): string {
  const result = buildReportDocument({
    template: templateBytes(),
    traces: custom,
    period: { year: 2026, month: 6 },
    generatedAt: EMISSION,
  });

  return readDocumentXml(result);
}

describe("buildReportDocument", () => {
  it("emite las tres tablas de trazas y no toca las manuales", () => {
    const result = build();

    expect(tableText(result, 6)).toContain("www.internacional.com");
    expect(tableText(result, 6)).toContain("5.00");
    expect(tableText(result, 7)).toContain("usuario.uno");
    expect(tableText(result, 7)).toContain("Ana Pérez");
    expect(tableText(result, 8)).toContain("500.00 MB");

    // La tabla 9 es manual: el generador no la vacía.
    expect(tableText(result, 9)).toContain("manual-h0");
    expect(tableText(result, 9)).toContain("manual0");
  });

  it("fecha el título, el período, la emisión y el cierre", () => {
    const result = build();

    expect(result).toContain(
      "Informe Mensual de Ciberseguridad. Junio 2026 v. Final.",
    );
    expect(result).toContain("01/06/2026 al 30/06/2026");
    expect(result).toContain("02/07/2026");
    expect(result).toContain(
      "Y para que así conste se firma la presente a los 2 días del mes de julio del año 2026",
    );
    expect(result).toContain("Día del comité: ___ / ___ / 2026");
  });

  it("arma la tabla 4 y marca las preguntas de incidencias", () => {
    const result = buildIncidentDoc(
      [incidentRow("www.malware.com", "Se bloqueó el sitio.")],
      ["ADULT"],
    );

    expect(tableText(result, 4)).toContain("www.malware.com");
    expect(tableText(result, 4)).toContain("Contenido para adultos");
    expect(tableText(result, 4)).toContain("Se bloqueó el sitio.");
    expect(result).toContain("Si __X__");
    expect(result).toContain("No __X__");
  });

  it("no agrega la nota de cobertura del diseño anterior", () => {
    const result = buildReportDocument({
      template: templateBytes(),
      traces: traces(),
      period: { year: 2026, month: 6 },
      generatedAt: EMISSION,
    });
    const xml = readDocumentXml(result);

    expect(xml).not.toContain("Cobertura");
    expect(xml).not.toContain("Browsing Time es aproximado");
  });

  it("genera el documento desde un stream de log", async () => {
    const logLine = (epochMs: number, url: string) =>
      `${Math.floor(epochMs / 1000)}.000    100 10.0.0.1 TCP_MISS/200 500 GET ${url} ana HIER_DIRECT/1.2.3.4 text/html`;
    const stream = Readable.from([
      [
        logLine(Date.UTC(2026, 5, 1, 16, 0, 0), "http://www.internacional.com/"),
        logLine(Date.UTC(2026, 5, 1, 16, 1, 0), "http://www.nacional.cu/"),
      ].join("\n"),
    ]);

    const ingested = await ingestSquidLog(stream, {
      period: monthlyPeriod(2026, 6),
    });
    const { report, document } = buildMonthlyDocument({
      template: templateBytes(),
      days: ingested.days,
      period: { year: 2026, month: 6 },
      generatedAt: EMISSION,
      profiles: {
        ana: { fullName: "Ana Pérez", position: "Analista" },
      },
    });
    const result = readDocumentXml(document);

    expect(report.traces.topSites.map((site) => site.site)).toEqual([
      "www.internacional.com",
      "www.nacional.cu",
    ]);
    expect(tableText(result, 6)).toContain("www.internacional.com");
    expect(tableText(result, 7)).toContain("Ana Pérez");
    expect(result).toContain("Informe Mensual de Ciberseguridad. Junio 2026 v. Final.");
    expect(result).not.toContain("Cobertura incompleta");
    expect(result).not.toContain("El Browsing Time es aproximado");
  });
});
