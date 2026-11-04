import { describe, expect, it } from "vitest";
import type { IncidentCategory, IncidentRow } from "../findings/incidents";
import { emitIncidents, INCIDENT_TABLE } from "./incidents";

const CELL = (text: string) =>
  `<w:tc><w:tcPr/><w:p><w:r><w:t>${text}</w:t></w:r></w:p></w:tc>`;
const ROW = (values: string[]) => `<w:tr>${values.map(CELL).join("")}</w:tr>`;
const P = (text: string) => `<w:p><w:r><w:t>${text}</w:t></w:r></w:p>`;

/** Pregunta de la plantilla: `Si ____` y `No ____` en `<w:t>` separados por tab. */
const QUESTION = (prefix: string) =>
  `<w:p><w:r><w:t>${prefix} Si ____</w:t><w:tab/><w:t xml:space="preserve">No ____ </w:t></w:r></w:p>`;

const INCIDENTS_TABLE = `<w:tbl><w:tblPr/>${ROW([
  "No",
  "Dirección web (URL)",
  "Categoría",
  "Usuario",
  "Nombre y apellidos",
  "Cargo",
  "Medidas Técnicas",
])}${Array.from({ length: 5 }, () => ROW(Array.from({ length: 7 }, () => ""))).join("")}</w:tbl>`;

const DUMMY = `<w:tbl><w:tblPr/>${["relleno", "relleno"].map((value) => ROW([value, value])).join("")}</w:tbl>`;

function sample(): string {
  return [
    "<w:document><w:body>",
    DUMMY,
    DUMMY,
    DUMMY,
    INCIDENTS_TABLE,
    QUESTION("Visitas a sitios de contenido pornográfico o de adultos (citas, búsqueda de parejas, eróticos)"),
    P("De ser positiva la respuesta se elabora un Reporte de Incidencia al GST. UNE Si ____"),
    QUESTION("Visitas a sitios C/R o subversivos."),
    QUESTION("Visitas a sitios de malware."),
    P("otro texto intacto"),
    "</w:body></w:document>",
  ].join("");
}

function incident(url: string, measure = ""): IncidentRow {
  return {
    url,
    category: "ADULT",
    label: "Contenido para adultos",
    username: "ana",
    fullName: "Ana Pérez",
    position: "Analista",
    measure,
  };
}

function tableRow(xml: string, tableIndex: number, rowIndex: number): string {
  const tables = [...xml.matchAll(/<w:tbl(?:\s[^>]*)?>[\s\S]*?<\/w:tbl>/g)].map(
    (match) => match[0],
  );
  const rows = [...tables[tableIndex - 1].matchAll(/<w:tr(?:\s[^>]*)?>[\s\S]*?<\/w:tr>/g)].map(
    (match) => match[0],
  );

  return [
    ...rows[rowIndex].matchAll(/<w:t(?:\s[^>]*)?>([\s\S]*?)<\/w:t>/g),
  ]
    .map((match) => match[1])
    .join("|");
}

describe("emitIncidents", () => {
  it("declara el índice de la tabla de la plantilla real", () => {
    expect(INCIDENT_TABLE).toBe(4);
  });

  it("llena la tabla 4 con los hallazgos revisados", () => {
    const result = emitIncidents(
      sample(),
      [
        incident("www.malware.com", "Se bloqueó el sitio."),
        incident("www.otro.com"),
      ],
      new Set<IncidentCategory>(["ADULT"]),
    );

    expect(tableRow(result, INCIDENT_TABLE, 1)).toBe(
      "1|www.malware.com|Contenido para adultos|ana|Ana Pérez|Analista|Se bloqueó el sitio.",
    );
    expect(tableRow(result, INCIDENT_TABLE, 2)).toBe(
      "2|www.otro.com|Contenido para adultos|ana|Ana Pérez|Analista|",
    );
    const tables = [...result.matchAll(/<w:tbl(?:\s[^>]*)?>[\s\S]*?<\/w:tbl>/g)];
    const rows = [...tables[3][0].matchAll(/<w:tr(?:\s[^>]*)?>[\s\S]*?<\/w:tr>/g)];
    expect(rows).toHaveLength(3);
  });

  it("marca Si __X__ en la categoría con hallazgos y No __X__ en las demás", () => {
    const result = emitIncidents(
      sample(),
      [incident("www.malware.com")],
      new Set<IncidentCategory>(["ADULT"]),
    );

    expect(result).toContain(
      "Visitas a sitios de contenido pornográfico o de adultos (citas, búsqueda de parejas, eróticos) Si __X__",
    );
    expect(result).toContain(
      'w:t xml:space="preserve">No ____ </w:t>',
    );
    expect(result).toContain("Visitas a sitios C/R o subversivos. Si ____");
    expect(result).toContain("No __X__");
  });

  it("no toca la subpregunta del Reporte de Incidencia al GST. UNE", () => {
    const result = emitIncidents(
      sample(),
      [incident("www.malware.com")],
      new Set<IncidentCategory>(["ADULT"]),
    );

    expect(result).toContain(
      "De ser positiva la respuesta se elabora un Reporte de Incidencia al GST. UNE Si ____",
    );
  });

  it("regenerar sobre un documento ya marcado deja una sola respuesta", () => {
    const marcado = sample().replace(
      "Si ____",
      "Si __X__",
    );
    const result = emitIncidents(
      marcado,
      [],
      new Set<IncidentCategory>(),
    );

    expect(result).not.toContain("Si __X__");
    expect(result).toContain("Si ____");
    expect(result).toContain("No __X__");
  });
});
