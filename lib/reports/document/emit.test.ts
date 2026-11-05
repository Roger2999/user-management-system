import { describe, expect, it } from "vitest";
import type { TracesSection } from "../assembly/section-traces";
import { DEFAULT_TRACES_TABLES, emitTracesSection } from "./emit";

const CELL = (text: string) =>
  `<w:tc><w:tcPr/><w:p><w:r><w:t>${text}</w:t></w:r></w:p></w:tc>`;

const BANDS = {
  odd: "000000100000",
  even: "000000010000",
  last: "010000000000",
} as const;

const ROW = (values: string[], band?: keyof typeof BANDS) =>
  `<w:tr>${
    band === undefined
      ? ""
      : `<w:trPr><w:cnfStyle w:val="${BANDS[band]}"/></w:trPr>`
  }${values.map((value) => CELL(value)).join("")}</w:tr>`;

const PARAGRAPH = (text: string) =>
  `<w:p><w:r><w:t>${text}</w:t></w:r></w:p>`;

const GRID = (widths: number[]) =>
  `<w:tblGrid>${widths
    .map((width) => `<w:gridCol w:w="${width}"/>`)
    .join("")}</w:tblGrid>`;

const TABLE = (header: string[], rows: string[][], widths?: number[]) =>
  `<w:tbl><w:tblPr/>${GRID(widths ?? header.map(() => 1000))}${ROW(header)}${rows
    .map((row, index) => ROW(row, bandFor(index, rows.length)))
    .join("")}</w:tbl>`;

function bandFor(index: number, length: number): keyof typeof BANDS {
  if (index === length - 1) return "last";
  return index % 2 === 0 ? "odd" : "even";
}

const SITES_HEADER = ["No.", "Dirección web (URL)", "Tiempo total (hh.mm)", "Cantidad de usuarios"];
const USERS_HEADER = ["No.", "Usuario", "Nombre y apellidos", "Tiempo total (hh.mm)"];
const DOWNLOADS_HEADER = ["No.", "Usuario", "Nombre y apellidos", "Total descargado"];

const VIEJAS = (prefix: string) =>
  Array.from({ length: 5 }, (_value, index) => [
    String(index + 1),
    `${prefix}${index + 1}`,
    "viejo",
    "viejo",
  ]);

function sampleDocument(): string {
  const parts: string[] = ['<?xml version="1.0"?><w:document><w:body>'];

  for (let index = 1; index <= 5; index += 1) {
    parts.push(TABLE(["A", "B"], [[`a${index}`, `b${index}`]]));
    parts.push(PARAGRAPH(`relleno ${index}`));
  }

  parts.push(TABLE(SITES_HEADER, VIEJAS("viejo-sitio")));
  parts.push(PARAGRAPH("Sitios web más visitados:"));
  parts.push(TABLE(USERS_HEADER, VIEJAS("viejo-usuario")));
  parts.push(PARAGRAPH("Usuarios con más tiempo de navegación."));
  parts.push(TABLE(DOWNLOADS_HEADER, VIEJAS("viejo-descarga")));
  parts.push(PARAGRAPH("Usuarios con más descargas."));
  parts.push(TABLE(["A", "B"], [["a9", "b9"]]));

  parts.push("</w:body></w:document>");
  return parts.join("");
}

function tablesOf(xml: string): string[] {
  return [...xml.matchAll(/<w:tbl(?:\s[^>]*)?>[\s\S]*?<\/w:tbl>/g)].map(
    (match) => match[0],
  );
}

function traces(rows: number): TracesSection {
  return {
    topSites: Array.from({ length: rows }, (_value, index) => ({
      site: `www.nuevo${index}.com`,
      browsingTime: `1${index}.30`,
      users: String(index + 1),
    })),
    topUsers: Array.from({ length: rows }, (_value, index) => ({
      username: `cuenta${index}`,
      fullName: `Persona ${index}`,
      browsingTime: `2${index}.45`,
    })),
    topDownloads: Array.from({ length: rows }, (_value, index) => ({
      username: `cuenta${index}`,
      fullName: `Persona ${index}`,
      downloaded: `${index + 1}.00 GB`,
    })),
  };
}

describe("emitTracesSection", () => {
  it("reemplaza las tablas 6, 7 y 8 y no toca el resto", () => {
    const result = emitTracesSection(sampleDocument(), traces(2));
    const tables = tablesOf(result);

    expect(tables).toHaveLength(9);
    expect(tables[5]).toContain("www.nuevo0.com");
    expect(tables[5]).not.toContain("viejo-sitio1");
    expect(tables[6]).toContain("cuenta0");
    expect(tables[6]).not.toContain("viejo-usuario1");
    expect(tables[7]).toContain("1.00 GB");
    expect(tables[7]).not.toContain("viejo-descarga1");

    expect(tables[0]).toContain("a1");
    expect(tables[4]).toContain("a5");
    expect(tables[8]).toContain("a9");
    expect(result).toContain("Sitios web más visitados:");
    expect(result).toContain("Usuarios con más descargas.");
  });

  it("numera las filas según la selección, no según la plantilla", () => {
    const result = emitTracesSection(sampleDocument(), traces(2));
    const tables = tablesOf(result);

    for (const table of [tables[5], tables[6], tables[7]]) {
      expect(table).toContain("<w:t>1</w:t>");
      expect(table).toContain("<w:t>2</w:t>");
      expect(table).not.toContain("<w:t>3</w:t>");
    }
  });

  it("crece a más de cinco filas clonando las bandas de la plantilla", () => {
    const result = emitTracesSection(sampleDocument(), traces(7));
    const table = tablesOf(result)[5];
    const bands = [...table.matchAll(/<w:cnfStyle w:val="([01]+)"\/>/g)].map(
      (match) => match[1],
    );

    expect(table).toContain("www.nuevo6.com");
    expect(bands).toHaveLength(7);
    expect(bands[0]).toBe(BANDS.odd);
    expect(bands[1]).toBe(BANDS.even);
    expect(bands[6]).toBe(BANDS.last);
  });

  it("recorta a menos de cinco filas sin dejar restos de la plantilla", () => {
    const result = emitTracesSection(sampleDocument(), traces(1));
    const table = tablesOf(result)[6];

    expect(table).toContain("cuenta0");
    expect(table).not.toContain("cuenta1");
    expect(table).not.toContain("viejo-usuario");
  });

  it("usa los índices declarados del documento real", () => {
    expect(DEFAULT_TRACES_TABLES).toEqual({
      topSites: 6,
      topUsers: 7,
      topDownloads: 8,
    });
  });
});
