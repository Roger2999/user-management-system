/**
 * Composición del documento mensual.
 *
 * Junta las tres operaciones sobre la plantilla oficial, en el único orden que
 * importa: primero se emite la sección 1 (reemplaza tablas y puede quitar
 * drill-downs sobrantes, corriendo los índices), después se vacían las secciones
 * 2-7 y al final se fechan los campos del período.
 *
 * El documento no se reconstruye: se parte del `.docx` oficial y se reescribe
 * `word/document.xml`. Es la única forma de que el PDF salga indistinguible.
 */

import type { TracesSection } from "./assembly/section-traces";
import { DEFAULT_TIME_ZONE } from "./time";
import { blankSections } from "./document/blank-sections";
import { readDocumentXml, replaceDocumentXml } from "./document/docx";
import { emitTracesSection } from "./document/emit";
import { fillPeriodFields } from "./document/period";

export type ReportDocumentInput = {
  /** Bytes del `.docx` oficial, sin modificar. */
  template: Uint8Array;
  traces: TracesSection;
  /** Período informado. */
  period: { year: number; month: number };
  /** Instante de emisión; la fecha del documento se calcula en la zona local. */
  generatedAt: number;
  timeZone?: string;
};

/** Devuelve el `.docx` del informe listo para abrir en Word. */
export function buildReportDocument(input: ReportDocumentInput): Uint8Array {
  const xml = readDocumentXml(input.template);

  const withTraces = emitTracesSection(xml, input.traces);
  const blanked = blankSections(withTraces);
  const dated = fillPeriodFields(blanked, {
    month: input.period.month,
    year: input.period.year,
    generatedAt: input.generatedAt,
    timeZone: input.timeZone ?? DEFAULT_TIME_ZONE,
  });

  return replaceDocumentXml(input.template, dated);
}
