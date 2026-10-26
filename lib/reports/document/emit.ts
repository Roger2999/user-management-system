import {
  SITE_USER_TABLE_HEADERS,
  type SiteTableRow,
  type SiteUserTableRow,
  type TracesSection,
  type UserTableRow,
} from "../assembly/section-traces";
import {
  copyTableGrid,
  insertClonedTable,
  readTableHeader,
  removeTableWithHeading,
  replaceTableBodyRows,
  replaceTableHeaderRow,
  setSocialHeading,
  setTableHeading,
} from "./table-xml";

/**
 * Emisión de la sección 1 sobre el documento oficial.
 *
 * Los índices no son un detalle de implementación: son la estructura del
 * documento vigente, contada sobre `word/document.xml`. Están acá, explícitos y
 * con nombre, para que un cambio de plantilla falle en un lugar reconocible y no
 * escriba filas en la tabla equivocada.
 *
 * | Tabla | Contenido |
 * |---|---|
 * | 4 | sitios internacionales |
 * | 5–14 | diez drill-downs de usuarios, cada uno con el nombre del sitio en el párrafo anterior |
 * | 15 | los 10 usuarios que más descargaron |
 * | 16 | sitios nacionales |
 */
export const DEFAULT_TRACES_TABLES = {
  internationalSites: 4,
  firstDrilldown: 5,
  drilldownSlots: 10,
  topUsers: 15,
  nationalSites: 16,
} as const;

export type TracesTableMap = {
  internationalSites: number;
  firstDrilldown: number;
  drilldownSlots: number;
  topUsers: number;
  nationalSites: number;
};

/** Instrucción de la plantilla que precede a la tabla de redes sociales. */
export const SOCIAL_INSTRUCTION_PREFIX = "**Filtrar por “Browsing Time”.";

function siteRow(row: SiteTableRow): string[] {
  return [
    row.site,
    row.hits,
    row.incoming,
    row.outgoing,
    row.downloadTime,
    row.browsingTime,
    row.percentOfHits,
  ];
}

function siteUserRow(row: SiteUserTableRow): string[] {
  return [
    row.username,
    row.hits,
    row.incoming,
    row.downloadTime,
    row.browsingTime,
    row.percentOfBrowsingTime,
  ];
}

function userRow(row: UserTableRow): string[] {
  return [
    row.username,
    row.hits,
    row.incoming,
    row.outgoing,
    row.downloadTime,
    row.browsingTime,
    row.percentOfBrowsingTime,
  ];
}

/**
 * Reemplaza las tablas de la sección 1 y deja el resto del documento intacto.
 *
 * Si la selección tiene menos drill-downs que ranuras, las sobrantes se eliminan
 * con su título. Si tiene más, falla: la plantilla tiene diez ranuras y clonar
 * tablas enteras no está implementado, así que inventar una sería peor que
 * decirlo.
 */
export function emitTracesSection(
  documentXml: string,
  traces: TracesSection,
  map: TracesTableMap = DEFAULT_TRACES_TABLES,
): string {
  const drilldowns = traces.siteDrilldowns;

  if (drilldowns.length > map.drilldownSlots) {
    throw new RangeError(
      `la plantilla tiene ${map.drilldownSlots} drill-downs y la selección tiene ${drilldowns.length}`,
    );
  }

  let xml = documentXml;

  const lastSlot = map.firstDrilldown + map.drilldownSlots - 1;
  if (map.topUsers <= lastSlot || map.nationalSites <= lastSlot) {
    throw new RangeError(
      "el mapa de tablas debe ubicar el top de usuarios y la tabla nacional después de los drill-downs",
    );
  }

  // De atrás hacia adelante: quitar la última no mueve los índices anteriores.
  for (let slot = map.drilldownSlots - 1; slot >= drilldowns.length; slot -= 1) {
    xml = removeTableWithHeading(xml, map.firstDrilldown + slot);
  }

  // Las tablas que están después del bloque de drill-downs se corren tantas
  // posiciones como tablas se quitaron.
  const shift = map.drilldownSlots - drilldowns.length;

  drilldowns.forEach((drilldown, position) => {
    const tableIndex = map.firstDrilldown + position;

    // Solo las tablas cuya cabecera hay que corregir adoptan el ancho de la
    // primera: las demás ya tienen el layout correcto y copiarlo les angosta
    // columnas que estaban bien (bing partía `912` en dos líneas).
    const header = readTableHeader(xml, tableIndex);
    const headerChanges =
      header.join("\u0000") !== SITE_USER_TABLE_HEADERS.join("\u0000");

    if (headerChanges && tableIndex !== map.firstDrilldown) {
      xml = copyTableGrid(xml, {
        tableIndex,
        referenceTableIndex: map.firstDrilldown,
      });
    }

    // El título de la tabla es el nombre del sitio: si cambia la selección, el
    // título viejo no puede quedar.
    xml = setTableHeading(xml, { tableIndex, text: drilldown.site });
    xml = replaceTableHeaderRow(xml, {
      tableIndex,
      values: SITE_USER_TABLE_HEADERS,
    });
    xml = replaceTableBodyRows(xml, {
      tableIndex,
      rows: drilldown.rows.map(siteUserRow),
    });
  });

  xml = replaceTableBodyRows(xml, {
    tableIndex: map.internationalSites,
    rows: traces.internationalSites.map(siteRow),
  });

  xml = replaceTableBodyRows(xml, {
    tableIndex: map.nationalSites - shift,
    rows: traces.nationalSites.map(siteRow),
  });

  xml = replaceTableBodyRows(xml, {
    tableIndex: map.topUsers - shift,
    rows: traces.topUsers.map(userRow),
  });

  if (traces.social === null) {
    // Sin datos sociales no se hereda el "Facebook" de la plantilla.
    xml = setSocialHeading(xml, null);
    return xml;
  }

  if (drilldowns.length === 0) {
    throw new RangeError(
      "la tabla de redes sociales necesita un drill-down como molde",
    );
  }

  xml = setSocialHeading(xml, traces.social.network);
  xml = insertClonedTable(xml, {
    referenceTableIndex: map.firstDrilldown,
    afterParagraphPrefix: SOCIAL_INSTRUCTION_PREFIX,
    header: SITE_USER_TABLE_HEADERS,
    rows: traces.social.rows.map(siteUserRow),
  });

  return xml;
}
