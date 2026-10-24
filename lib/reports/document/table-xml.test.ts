import { describe, expect, it } from "vitest";
import { escapeXml, replaceTableBodyRows } from "./table-xml";

const CELL = (text: string, extra = "") =>
  `<w:tc><w:tcPr/>${extra}<w:p><w:r><w:t>${text}</w:t></w:r></w:p></w:tc>`;

const ROW = (values: string[], extra = "") =>
  `<w:tr${extra}>${values.map((value) => CELL(value)).join("")}</w:tr>`;

const DOCUMENT = `<?xml version="1.0"?>
<w:document><w:body>
<w:tbl><w:tblPr/><w:tblGrid/>
${ROW(["Sites", "Hits"])}
${ROW(["www.a.com", "1"], ' w:rsidR="00A1"')}
${ROW(["www.b.com", "2"])}
<w:tblPrEx/></w:tbl>
<w:p><w:r><w:t>texto entre tablas</w:t></w:r></w:p>
<w:tbl><w:tblPr/>
${ROW(["Otra", "Tabla"])}
${ROW(["sin", "tocar"])}
</w:tbl>
</w:body></w:document>`;

describe("replaceTableBodyRows", () => {
  it("reemplaza las filas de datos y deja la cabecera", () => {
    const result = replaceTableBodyRows(DOCUMENT, {
      tableIndex: 1,
      rows: [
        ["www.c.com", "10"],
        ["www.d.com", "20"],
        ["www.e.com", "30"],
      ],
    });

    expect(result).toContain("Sites</w:t>");
    expect(result).toContain("Hits</w:t>");
    expect(result).not.toContain("www.a.com");
    expect(result).not.toContain("www.b.com");
    expect(result.match(/<w:tr/g)).toHaveLength(6); // 2 cabeceras + 4 filas de datos
  });

  it("clona el formato de la fila molde", () => {
    const result = replaceTableBodyRows(DOCUMENT, {
      tableIndex: 1,
      rows: [["www.c.com", "10"]],
    });

    // `rsidR` viene del molde: la fila nueva conserva las propiedades de la
    // primera fila de datos del original.
    expect(result).toContain('w:rsidR="00A1"');
    expect(result).toContain("<w:tcPr/>");
  });

  it("no toca las demás tablas ni el texto entre ellas", () => {
    const result = replaceTableBodyRows(DOCUMENT, {
      tableIndex: 1,
      rows: [["www.c.com", "10"]],
    });

    expect(result).toContain("texto entre tablas");
    expect(result).toContain("Otra</w:t>");
    expect(result).toContain("sin</w:t>");
  });

  it("escapa los caracteres reservados de XML", () => {
    const result = replaceTableBodyRows(DOCUMENT, {
      tableIndex: 1,
      rows: [["sitio & otro <raro>", "1"]],
    });

    expect(result).toContain("sitio &amp; otro &lt;raro&gt;");
    expect(result).not.toContain("<raro>");
  });

  it("falla si la fila no tiene la cantidad de celdas de la tabla", () => {
    expect(() =>
      replaceTableBodyRows(DOCUMENT, {
        tableIndex: 1,
        rows: [["solo una celda"]],
      }),
    ).toThrow(RangeError);
  });

  it("falla si la tabla no existe", () => {
    expect(() =>
      replaceTableBodyRows(DOCUMENT, { tableIndex: 9, rows: [] }),
    ).toThrow(RangeError);
  });

  it("deja solo la cabecera cuando no hay filas de datos", () => {
    const result = replaceTableBodyRows(DOCUMENT, { tableIndex: 1, rows: [] });

    expect(result).toContain("Sites</w:t>");
    expect(result).not.toContain("www.a.com");
    expect(result).not.toContain("www.b.com");
  });
});

describe("escapeXml", () => {
  it("escapa solo lo necesario", () => {
    expect(escapeXml("a & b < c > d")).toBe("a &amp; b &lt; c &gt; d");
  });
});
