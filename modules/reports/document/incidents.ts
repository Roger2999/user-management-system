import {
  INCIDENT_QUESTIONS,
  type IncidentCategory,
  type IncidentRow,
} from "../findings/incidents";
import {
  paragraphText,
  replaceTextInRuns,
  topLevelBlocks,
} from "./blocks";
import { replaceTableBodyRows } from "./table-xml";

/**
 * Emisión de la tabla 4 y de las cinco preguntas de incidencias.
 *
 * La tabla se reemplaza completa: la plantilla trae cinco filas vacías y el
 * documento crece si hay más hallazgos. El índice 4 es el de la plantilla v2,
 * contado sobre `word/document.xml`.
 *
 * Las preguntas se marcan en el párrafo de la pregunta, no en la subpregunta de
 * "Reporte de Incidencia al GST. UNE": esa sigue siendo una decisión manual.
 */
export const INCIDENT_TABLE = 4;

/**
 * Marca `Si __X__` o `No __X__` en un párrafo.
 *
 * La plantilla trae `Si ____` en un `<w:t>` y `No ____` en otro separados por un
 * tabulador. Se limpian las dos marcas antes de escribir para que regenerar el
 * mismo período no deje las dos respuestas marcadas.
 */
function markChoice(paragraphXml: string, checked: boolean): string {
  let xml = replaceTextInRuns(paragraphXml, "Si __X__", "Si ____");
  xml = replaceTextInRuns(xml, "No __X__", "No ____");

  return checked
    ? replaceTextInRuns(xml, "Si ____", "Si __X__")
    : replaceTextInRuns(xml, "No ____", "No __X__");
}

/** Marca las cinco preguntas según las categorías con hallazgos. */
export function emitIncidentCheckboxes(
  documentXml: string,
  categories: ReadonlySet<IncidentCategory>,
): string {
  let out = "";
  let cursor = 0;

  for (const block of topLevelBlocks(documentXml)) {
    out += documentXml.slice(cursor, block.start);
    cursor = block.end;

    if (block.kind !== "paragraph") {
      out += block.xml;
      continue;
    }

    const text = paragraphText(block.xml);
    const question = INCIDENT_QUESTIONS.find((candidate) =>
      text.startsWith(candidate.prefix),
    );

    out +=
      question === undefined
        ? block.xml
        : markChoice(block.xml, categories.has(question.category));
  }

  out += documentXml.slice(cursor);
  return out;
}

/** Reemplaza la tabla 4 y marca las preguntas. */
export function emitIncidents(
  documentXml: string,
  incidents: readonly IncidentRow[],
  categories: ReadonlySet<IncidentCategory>,
): string {
  const withTable = replaceTableBodyRows(documentXml, {
    tableIndex: INCIDENT_TABLE,
    rows: incidents.map((incident, position) => [
      String(position + 1),
      incident.url,
      incident.label,
      incident.username,
      incident.fullName,
      incident.position,
      incident.measure,
    ]),
  });

  return emitIncidentCheckboxes(withTable, categories);
}
