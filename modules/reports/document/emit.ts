import type { TracesSection } from "../assembly/section-traces";
import { replaceTableBodyRows } from "./table-xml";

/**
 * Emisión de las trazas sobre la plantilla oficial v2.
 *
 * Los índices son la estructura del documento, contada sobre `word/document.xml`.
 * Están acá, explícitos y con nombre, para que un cambio de plantilla falle en un
 * lugar reconocible y no escriba filas en la tabla equivocada.
 *
 * | Tabla | Contenido |
 * |---|---|
 * | 6 | sitios web más visitados |
 * | 7 | usuarios con más tiempo de navegación |
 * | 8 | usuarios con más descargas |
 */
export const DEFAULT_TRACES_TABLES = {
  topSites: 6,
  topUsers: 7,
  topDownloads: 8,
} as const;

export type TracesTableMap = {
  topSites: number;
  topUsers: number;
  topDownloads: number;
};

/**
 * Reemplaza las filas de las tres tablas de trazas.
 *
 * La plantilla trae cinco filas de datos con el `No.` escrito a mano. El
 * reemplazo las pisa, así que el índice se pasa siempre como primer valor: si se
 * dejara el de la plantilla, el top 5 saldría numerado igual pero cualquier
 * recorte (`limit`) mentiría.
 */
export function emitTracesSection(
  documentXml: string,
  traces: TracesSection,
  map: TracesTableMap = DEFAULT_TRACES_TABLES,
): string {
  let xml = documentXml;

  xml = replaceTableBodyRows(xml, {
    tableIndex: map.topSites,
    rows: traces.topSites.map((row, position) => [
      String(position + 1),
      row.site,
      row.browsingTime,
      row.users,
    ]),
  });

  xml = replaceTableBodyRows(xml, {
    tableIndex: map.topUsers,
    rows: traces.topUsers.map((row, position) => [
      String(position + 1),
      row.username,
      row.fullName,
      row.browsingTime,
    ]),
  });

  xml = replaceTableBodyRows(xml, {
    tableIndex: map.topDownloads,
    rows: traces.topDownloads.map((row, position) => [
      String(position + 1),
      row.username,
      row.fullName,
      row.downloaded,
    ]),
  });

  return xml;
}
