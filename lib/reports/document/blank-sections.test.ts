import { describe, expect, it } from "vitest";
import {
  DEFAULT_BLANK_SECTIONS,
  blankParagraphText,
  blankSections,
  type BlankSectionsSpec,
} from "./blank-sections";

const PARAGRAPH = (text: string, extra = "") =>
  `<w:p>${extra}<w:r><w:t>${text}</w:t></w:r></w:p>`;

const CELL = (text: string) =>
  `<w:tc><w:tcPr/><w:p><w:r><w:t>${text}</w:t></w:r></w:p></w:tc>`;

const ROW = (values: string[]) =>
  `<w:tr>${values.map((value) => CELL(value)).join("")}</w:tr>`;

const TABLE = (rows: string[][]) =>
  `<w:tbl><w:tblPr/><w:tblGrid/>${rows.map((row) => ROW(row)).join("")}</w:tbl>`;

const SPEC: BlankSectionsSpec = {
  fromHeading: "Inicio de las secciones",
  tables: [
    { tableIndex: 2, headerRows: 1 },
    { tableIndex: 3, headerRows: 0 },
    { tableIndex: 4, headerRows: 2 },
  ],
};

function sample(): string {
  return [
    '<?xml version="1.0"?><w:document><w:body>',
    PARAGRAPH("seccion uno intacta"),
    TABLE([["Sites", "Hits"], ["www.uno.com", "10"]]),
    PARAGRAPH("Inicio de las secciones"),
    PARAGRAPH("Cantidad de Usuarios Autorizados: -"),
    PARAGRAPH("dtor.despacho@elecmtz.une.cu"),
    PARAGRAPH("COMER_SIGECO"),
    PARAGRAPH("Cantidad de Virus o programa maligno detectados__10___"),
    PARAGRAPH("Se tiene un registro actualizado de los ordenadores."),
    TABLE([["Alertas", "Fecha"], ["-", "-"]]),
    TABLE([["HEUR:Trojan.Uno"], ["Virus.Dos"]]),
    TABLE([
      ["Grupo A", "Grupo B"],
      ["Local", "Territorial"],
      ["2", "278"],
    ]),
    "</w:body></w:document>",
  ].join("");
}

function rowsOf(xml: string): string[][] {
  return [...xml.matchAll(/<w:tr(?:\s[^>]*)?>[\s\S]*?<\/w:tr>/g)].map((row) =>
    [...row[0].matchAll(/<w:tc(?:\s[^>]*)?>[\s\S]*?<\/w:tc>/g)].map((cell) =>
      [...cell[0].matchAll(/<w:t(?:\s[^>]*)?>([\s\S]*?)<\/w:t>/g)]
        .map((text) => text[1])
        .join(""),
    ),
  );
}

describe("blankParagraphText", () => {
  it("conserva la etiqueta y descarta el valor después de los dos puntos", () => {
    expect(blankParagraphText("Cantidad de máquinas afectadas: 10")).toBe(
      "Cantidad de máquinas afectadas:",
    );
    expect(blankParagraphText("Datos:")).toBe("Datos:");
  });

  it("vacía correos y nombres de equipo", () => {
    expect(blankParagraphText("dtor.despacho@elecmtz.une.cu")).toBe("");
    expect(blankParagraphText("COMER_SIGECO")).toBe("");
    expect(blankParagraphText("MAYOROBET_MTZ")).toBe("");
  });

  it("borra lo escrito dentro de un hueco de guiones bajos", () => {
    expect(
      blankParagraphText("Cantidad de Virus o programa maligno detectados__10___"),
    ).toBe("Cantidad de Virus o programa maligno detectados_______");
    expect(blankParagraphText("Si __X__ NO ____")).toBe("Si _____ NO ____");
  });

  it("corta el relleno suelto al final", () => {
    expect(
      blankParagraphText(
        "10 usuarios que más uso hacen de ellos por cada uno de los servidores. -",
      ),
    ).toBe("10 usuarios que más uso hacen de ellos por cada uno de los servidores.");
  });

  it("conserva la prosa de plantilla sin separador", () => {
    const prose = "Se tiene un registro actualizado de los ordenadores.";
    expect(blankParagraphText(prose)).toBe(prose);
  });
});

describe("blankSections", () => {
  it("no toca lo anterior al encabezado de las secciones 2-7", () => {
    const result = blankSections(sample(), SPEC);

    expect(result).toContain("seccion uno intacta");
    expect(result).toContain("www.uno.com");
    expect(result).toContain("Inicio de las secciones");
  });

  it("vacía valores y conserva etiquetas, encabezado y prosa", () => {
    const result = blankSections(sample(), SPEC);

    expect(result).toContain("Cantidad de Usuarios Autorizados:");
    expect(result).not.toContain("Cantidad de Usuarios Autorizados: -");
    expect(result).not.toContain("dtor.despacho@elecmtz.une.cu");
    expect(result).not.toContain("COMER_SIGECO");
    expect(result).not.toContain("10___");
    expect(result).toContain(
      "Se tiene un registro actualizado de los ordenadores.",
    );
  });

  it("conserva las filas de cabecera y vacía las de datos", () => {
    const result = blankSections(sample(), SPEC);
    const tables = [...result.matchAll(/<w:tbl>[\s\S]*?<\/w:tbl>/g)].map(
      (match) => match[0],
    );

    // Tabla 2: una cabecera.
    expect(rowsOf(tables[1])[0]).toEqual(["Alertas", "Fecha"]);
    expect(rowsOf(tables[1])[1]).toEqual(["", ""]);

    // Tabla 3: sin cabecera, todo es dato.
    expect(rowsOf(tables[2])).toEqual([[""], [""]]);

    // Tabla 4: dos cabeceras, el resto vacío.
    expect(rowsOf(tables[3])[0]).toEqual(["Grupo A", "Grupo B"]);
    expect(rowsOf(tables[3])[1]).toEqual(["Local", "Territorial"]);
    expect(rowsOf(tables[3])[2]).toEqual(["", ""]);
  });

  it("falla si hay una tabla sin declarar en las secciones 2-7", () => {
    const xml = sample().replace(
      "</w:body>",
      `${TABLE([["Sorpresa"]])}</w:body>`,
    );

    expect(() => blankSections(xml, SPEC)).toThrow(/tabla 5.*no está declarada/);
  });

  it("falla si no encuentra el encabezado", () => {
    expect(() =>
      blankSections(sample(), { ...SPEC, fromHeading: "No existe" }),
    ).toThrow(/no se encontró el encabezado/);
  });

  it("declara las tablas reales del documento de mayo", () => {
    expect(DEFAULT_BLANK_SECTIONS).toEqual({
      fromHeading: "Uso de correo por webmail en servidores nacionales:",
      tables: [
        { tableIndex: 18, headerRows: 2 },
        { tableIndex: 19, headerRows: 0 },
        { tableIndex: 20, headerRows: 1 },
        { tableIndex: 21, headerRows: 1 },
        { tableIndex: 22, headerRows: 3 },
      ],
    });
  });
});
