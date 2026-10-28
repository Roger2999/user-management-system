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

const cols = (count: number, prefix: string) =>
  Array.from({ length: count }, (_value, index) => `${prefix}${index}`);

const dummy = (prefix: string) => TABLE([cols(2, `${prefix}h`), cols(2, prefix)]);

/**
 * Documento sintético con la misma estructura que el oficial: 22 tablas en el
 * mismo orden y el encabezado que abre las secciones 2-7.
 */
function template(): string {
  const body: string[] = [
    P("Matanzas, 9 de Mayo de 2026"),
    P("Informe mensual correspondiente al mes mayo de 2026"),
    P("En la evaluación de las trazas del mes de Mayo no se detectaron incidencias."),
    dummy("t1"),
    dummy("t2"),
    dummy("t3"),
    TABLE([cols(7, "int-h"), cols(7, "int")]),
  ];

  for (let index = 0; index < 10; index += 1) {
    body.push(P(`sitio ${index + 1}.cu`));
    body.push(TABLE([cols(6, "dd-h"), cols(6, "dd")]));
  }

  body.push(TABLE([cols(7, "users-h"), cols(7, "users")]));
  body.push(P("Redes Sociales más utilizadas en la entidad: Facebook"));
  body.push(P("Usuarios con más tiempo de conexión en las mismas"));
  body.push(P("**Filtrar por “Browsing Time”."));
  body.push(TABLE([cols(7, "nac-h"), cols(7, "nac")]));
  body.push(dummy("t17"));
  body.push(P("Uso de correo por webmail en servidores nacionales:"));
  body.push(TABLE([cols(3, "usb-h1"), cols(3, "usb-h2"), cols(3, "usb")]));
  body.push(TABLE([cols(1, "virus")]));
  body.push(TABLE([cols(5, "vuln-h"), cols(5, "vuln")]));
  body.push(TABLE([cols(2, "ids-h"), cols(2, "ids")]));
  body.push(
    TABLE([cols(3, "res-h1"), cols(3, "res-h2"), cols(3, "res-h3"), cols(3, "res")]),
  );

  return `<w:document><w:body>${body.join("")}</w:body></w:document>`;
}

const siteRow = (site: string) => ({
  site,
  hits: "1",
  incoming: "0.00",
  outgoing: "0.00",
  downloadTime: "00:00:01",
  browsingTime: "00:00:01",
  percentOfHits: "1.0%",
});

const siteUserRow = (username: string) => ({
  username,
  hits: "1",
  incoming: "0.00",
  downloadTime: "00:00:01",
  browsingTime: "00:00:01",
  percentOfBrowsingTime: "1.0%",
});

const userRow = (username: string) => ({
  ...siteUserRow(username),
  outgoing: "0.00",
});

function traces(): TracesSection {
  return {
    internationalSites: [siteRow("www.nuevo.cu")],
    nationalSites: [siteRow("www.nacional.cu")],
    siteDrilldowns: Array.from({ length: 10 }, (_value, index) => ({
      site: `elegido ${index + 1}.cu`,
      rows: [siteUserRow("usuario.uno")],
    })),
    topUsers: [userRow("usuario.dos")],
    social: null,
  };
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
  it("emite la sección 1 con los valores del período", () => {
    const result = build();

    expect(tableText(result, 4)).toContain("www.nuevo.cu");
    expect(tableText(result, 16)).toContain("www.nacional.cu");
    expect(tableText(result, 15)).toContain("usuario.dos");
    expect(tableText(result, 5)).toContain("usuario.uno");
  });

  it("inserta la tabla social y corre el vaciado de las secciones 2-7", () => {
    const custom = traces();
    custom.social = {
      network: "WhatsApp",
      rows: [siteUserRow("red.social2")],
    };

    const result = build(custom);

    expect(tableText(result, 16)).toContain("red.social2");
    expect(tableText(result, 17)).toContain("www.nacional.cu");
    // La tabla USB pasó de 18 a 19 y sigue vacía.
    expect(tableText(result, 19)).toBe(
      "usb-h10usb-h11usb-h12usb-h20usb-h21usb-h22",
    );
    expect(result).toContain(
      "Redes Sociales más utilizadas en la entidad: WhatsApp",
    );
  });

  it("vuelve vacías las tablas de las secciones 2-7", () => {
    const result = build();

    // Tabla 18: dos cabeceras y una fila de datos vacía.
    expect(tableText(result, 18)).toBe("usb-h10usb-h11usb-h12usb-h20usb-h21usb-h22");
    // Tabla 19: sin cabecera, todo dato.
    expect(tableText(result, 19)).toBe("");
    // Tabla 22: tres cabeceras y el dato vacío.
    expect(tableText(result, 22)).toContain("res-h10");
    expect(tableText(result, 22)).not.toContain("res0");
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
    });
    const result = readDocumentXml(document);

    expect(report.traces.internationalSites.map((site) => site.site)).toEqual([
      "www.internacional.com",
    ]);
    expect(result).toContain("www.internacional.com");
    expect(result).toContain("Matanzas, 2 de Julio de 2026");

    // La nota de S7/S12 cierra la sección 1, antes del encabezado de la 2.
    const declaration = result.indexOf("Cobertura incompleta:");
    const anchor = result.indexOf(
      "Uso de correo por webmail en servidores nacionales:",
    );

    expect(declaration).toBeGreaterThan(0);
    expect(declaration).toBeLessThan(anchor);
    expect(result).toContain("Cobertura incompleta: 1 de 30 días importados");
    expect(result).toContain("El Browsing Time es aproximado");
  });

  it("corre las tablas de las secciones 2-7 si sobran ranuras de drill-down", () => {
    const nine = traces();
    nine.siteDrilldowns = nine.siteDrilldowns.slice(0, 9);

    const result = build(nine);

    // Al quitar la décima ranura, las tablas posteriores se corren una posición.
    expect(tableText(result, 17)).toBe(
      "usb-h10usb-h11usb-h12usb-h20usb-h21usb-h22",
    );
    expect(tableText(result, 18)).toBe("");
    expect(result).toContain("Matanzas, 2 de Julio de 2026");
  });

  it("fecha el documento y declara el mes del período", () => {
    const result = build();

    expect(result).toContain("Matanzas, 2 de Julio de 2026");
    expect(result).toContain(
      "Informe mensual correspondiente al mes junio de 2026",
    );
    expect(result).toContain("trazas del mes de Junio");
    expect(result).not.toContain("mes de Mayo");
  });
});
