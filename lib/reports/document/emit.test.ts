import { describe, expect, it } from "vitest";
import {
  SITE_USER_TABLE_HEADERS,
  type TracesSection,
} from "../assembly/section-traces";
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
    .map((row) => ROW(row))
    .join("")}</w:tbl>`;

const SITE_HEADER = [
  "Sites",
  "Hits",
  "Incoming (MB)",
  "Outgoing (MB)",
  "Download Time (h:m:s)",
  "Browsing Time (h:m:s)",
  "% of Hits",
];

const DRILLDOWN_HEADER = [...SITE_USER_TABLE_HEADERS];

const HITS_DRILLDOWN_HEADER = [
  "Users",
  "Hits",
  "Incoming (MB)",
  "Download Time (h:m:s)",
  "Browsing Time (h:m:s)",
  "% of Hits",
];

const TOP_USERS_HEADER = [
  "Users",
  "Hits",
  "Incoming (MB)",
  "Outgoing (MB)",
  "Download Time (h:m:s)",
  "Browsing Time (h:m:s)",
  "% of Browsing Time (h:m:s)",
];

function sampleDocument(): string {
  const parts: string[] = ['<?xml version="1.0"?><w:document><w:body>'];

  for (let index = 1; index <= 3; index += 1) {
    parts.push(TABLE(["A", "B"], [[`a${index}`, `b${index}`]]));
    parts.push(PARAGRAPH(`relleno ${index}`));
  }

  parts.push(TABLE(SITE_HEADER, [["www.viejo-int.com", "1", "0.00", "0.00", "00:00:01", "00:00:01", "0.0%"]]));
  parts.push(PARAGRAPH("titulo internacional"));

  for (let slot = 0; slot < 10; slot += 1) {
    // Las dos últimas vienen exportadas por hits, con la última columna angosta,
    // como en el documento real.
    const hitsTable = slot >= 8;
    const widths = [1240 + slot, 626, 1317, 1962, 1888, hitsTable ? 875 : 2255];
    const header = hitsTable ? HITS_DRILLDOWN_HEADER : DRILLDOWN_HEADER;
    const row = [`usuario${slot}`, "1", "0.00", "00:00:01", "00:00:01", "1.0%"];

    parts.push(PARAGRAPH(`viejo${slot}.com`));
    parts.push(
      `<w:tbl><w:tblPr/>${GRID(widths)}${ROW(header)}${ROW(row, "odd")}${ROW(row, "even")}${ROW(row, "last")}</w:tbl>`,
    );
  }

  parts.push(PARAGRAPH("Los 10 usuarios que más descargaron."));
  parts.push(TABLE(TOP_USERS_HEADER, [["viejo-usuario", "1", "0.00", "0.00", "00:00:01", "00:00:01", "0.0%"]]));

  parts.push(PARAGRAPH("Redes Sociales más utilizadas en la entidad: Facebook"));
  parts.push(PARAGRAPH("Usuarios con más tiempo de conexión en las mismas"));
  parts.push(PARAGRAPH("**Filtrar por “Browsing Time”."));

  parts.push(PARAGRAPH("titulo nacional"));
  parts.push(TABLE(SITE_HEADER, [["www.viejo-nac.cu", "1", "0.00", "0.00", "00:00:01", "00:00:01", "0.0%"]]))

  parts.push("</w:body></w:document>");
  return parts.join("");
}

function tablesOf(xml: string): string[] {
  return [...xml.matchAll(/<w:tbl(?:\s[^>]*)?>[\s\S]*?<\/w:tbl>/g)].map(
    (match) => match[0],
  );
}

function traces(drilldownCount: number): TracesSection {
  return {
    internationalSites: [
      {
        site: "www.nuevo-int.com",
        hits: "10",
        incoming: "1.00",
        outgoing: "0.00",
        downloadTime: "00:00:10",
        browsingTime: "00:01:00",
        percentOfHits: "0.1%",
      },
    ],
    nationalSites: [
      {
        site: "www.nuevo-nac.cu",
        hits: "20",
        incoming: "2.00",
        outgoing: "0.00",
        downloadTime: "00:00:20",
        browsingTime: "00:02:00",
        percentOfHits: "0.2%",
      },
    ],
    siteDrilldowns: Array.from({ length: drilldownCount }, (_unused, index) => ({
      site: `nuevo${index}.com`,
      rows: [
        {
          username: `cuenta${index}`,
          hits: "5",
          incoming: "0.50",
          downloadTime: "00:00:05",
          browsingTime: "00:00:30",
          percentOfBrowsingTime: "50.0%",
        },
      ],
    })),
    topUsers: [
      {
        username: "cuenta-top",
        hits: "9",
        incoming: "0.90",
        outgoing: "0.09",
        downloadTime: "00:00:09",
        browsingTime: "00:09:00",
        percentOfBrowsingTime: "9.0%",
      },
    ],
    social: null,
  };
}

describe("emitTracesSection", () => {
  it("reemplaza las tablas de la sección 1 y no toca el resto", () => {
    const result = emitTracesSection(sampleDocument(), traces(10));
    const tables = tablesOf(result);

    expect(tables).toHaveLength(16);
    expect(tables[3]).toContain("www.nuevo-int.com");
    expect(tables[3]).not.toContain("www.viejo-int.com");
    expect(tables[14]).toContain("cuenta-top");
    expect(tables[15]).toContain("www.nuevo-nac.cu");
    expect(tables[15]).not.toContain("www.viejo-nac.cu");

    // Las tres primeras tablas son de otras secciones.
    expect(tables[0]).toContain("a1");
    expect(tables[2]).toContain("a3");
    expect(result).toContain("titulo internacional");
    expect(result).toContain("titulo nacional");
  });

  it("inserta la tabla de la red social más usada antes de la tabla nacional", () => {
    const base = traces(10);
    const withSocial: TracesSection = {
      ...base,
      social: {
        network: "WhatsApp",
        rows: [
          {
            username: "red.social2",
            hits: "10",
            incoming: "1.00",
            downloadTime: "00:10:00",
            browsingTime: "05:00:00",
            percentOfBrowsingTime: "99.3%",
          },
        ],
      },
    };

    const result = emitTracesSection(sampleDocument(), withSocial);
    const tables = tablesOf(result);

    expect(tables).toHaveLength(17);
    expect(tables[15]).toContain("red.social2");
    expect(tables[16]).toContain("www.nuevo-nac.cu");
    expect(result).toContain(
      "Redes Sociales más utilizadas en la entidad: WhatsApp",
    );
    expect(result).not.toContain("entidad: Facebook");
    expect(result.indexOf("red.social2")).toBeGreaterThan(
      result.indexOf("**Filtrar por “Browsing Time”."),
    );
  });

  it("no hereda la red social de la plantilla si no hay datos", () => {
    const result = emitTracesSection(sampleDocument(), traces(10));

    expect(result).toContain("Redes Sociales más utilizadas en la entidad:");
    expect(result).not.toContain("entidad: Facebook");
  });

  it("elimina los drill-downs sobrantes con su título", () => {
    const result = emitTracesSection(sampleDocument(), traces(2));
    const tables = tablesOf(result);

    expect(tables).toHaveLength(8);
    expect(result).not.toContain("viejo2.com");
    expect(result).not.toContain("viejo9.com");
    expect(result).toContain("nuevo0.com");
    expect(result).toContain("nuevo1.com");

    // Después de los dos drill-downs quedan el top de usuarios y el nacional.
    expect(tables[6]).toContain("cuenta-top");
    expect(tables[7]).toContain("www.nuevo-nac.cu");
  });

  it("normaliza la cabecera de los diez drill-downs a Browsing Time", () => {
    const result = emitTracesSection(sampleDocument(), traces(10));
    const drilldowns = tablesOf(result).slice(4, 14);

    for (const drilldown of drilldowns) {
      expect(drilldown).toContain("Users");
      expect(drilldown).toContain(SITE_USER_TABLE_HEADERS[5]);
      expect(drilldown).not.toContain("% of Hits");
    }
  });

  it("iguala los anchos solo en los drill-downs que cambian de cabecera", () => {
    const result = emitTracesSection(sampleDocument(), traces(10));
    const drilldowns = tablesOf(result).slice(4, 14);
    const gridOf = (table: string) =>
      table.match(/<w:tblGrid>[\s\S]*?<\/w:tblGrid>/)?.[0];
    const reference = gridOf(drilldowns[0]);

    // Los ocho que ya tenían la cabecera correcta conservan su ancho: copiarles
    // el de la primera les angosta columnas que estaban bien.
    for (let slot = 1; slot < 8; slot += 1) {
      expect(gridOf(drilldowns[slot])).not.toBe(reference);
      expect(gridOf(drilldowns[slot])).toContain(
        `<w:gridCol w:w="${1240 + slot}"/>`,
      );
    }

    // Los dos exportados por hits adoptan el ancho de referencia.
    expect(gridOf(drilldowns[8])).toBe(reference);
    expect(gridOf(drilldowns[9])).toBe(reference);
  });

  it("conserva el zebra y el borde de la última fila al regenerarlas", () => {
    const base = traces(10);
    const [row] = base.siteDrilldowns[0].rows;
    const threeRows: TracesSection = {
      ...base,
      siteDrilldowns: base.siteDrilldowns.map((drilldown, index) =>
        index === 0
          ? {
              site: drilldown.site,
              rows: [
                row,
                { ...row, username: "otra" },
                { ...row, username: "ultima" },
              ],
            }
          : drilldown,
      ),
    };

    const result = emitTracesSection(sampleDocument(), threeRows);
    const first = tablesOf(result)[4];
    const bands = [
      ...first.matchAll(/<w:cnfStyle w:val="([01]+)"\/>/g),
    ].map((match) => match[1]);

    expect(bands).toEqual([
      "000000100000",
      "000000010000",
      "010000000000",
    ]);
  });

  it("falla si la selección tiene más drill-downs que la plantilla", () => {
    expect(() => emitTracesSection(sampleDocument(), traces(11))).toThrow(
      /10 drill-downs/,
    );
  });

  it("usa los índices declarados del documento real", () => {
    expect(DEFAULT_TRACES_TABLES).toEqual({
      internationalSites: 4,
      firstDrilldown: 5,
      drilldownSlots: 10,
      topUsers: 15,
      nationalSites: 16,
    });
  });
});
