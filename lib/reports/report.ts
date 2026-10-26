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
import type { DailyMetrics } from "./metrics/aggregate";
import { buildMonthlyReport, type MonthlyReport } from "./model/monthly";
import { DEFAULT_TIME_ZONE } from "./time";
import {
  DEFAULT_BLANK_SECTIONS,
  blankSections,
  type BlankSectionsSpec,
} from "./document/blank-sections";
import { readDocumentXml, replaceDocumentXml } from "./document/docx";
import { DEFAULT_TRACES_TABLES, emitTracesSection } from "./document/emit";
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

  // Si la selección trae menos de diez sitios, `emitTracesSection` elimina las
  // ranuras sobrantes y las tablas posteriores se corren. El mapa del vaciado
  // tiene que correrse igual, o buscaría las tablas 18-22 en otro lugar.
  const shift =
    DEFAULT_TRACES_TABLES.drilldownSlots - input.traces.siteDrilldowns.length;

  const blankSpec: BlankSectionsSpec = {
    ...DEFAULT_BLANK_SECTIONS,
    tables: DEFAULT_BLANK_SECTIONS.tables.map((table) => ({
      ...table,
      tableIndex: table.tableIndex - shift,
    })),
  };

  const blanked = blankSections(withTraces, blankSpec);
  const dated = fillPeriodFields(blanked, {
    month: input.period.month,
    year: input.period.year,
    generatedAt: input.generatedAt,
    timeZone: input.timeZone ?? DEFAULT_TIME_ZONE,
  });

  return replaceDocumentXml(input.template, dated);
}

export type MonthlyDocumentInput = {
  /** Bytes del `.docx` oficial, sin modificar. */
  template: Uint8Array;
  /** Días ya acumulados por `ingestSquidLog`. */
  days: readonly DailyMetrics[];
  period: { year: number; month: number };
  generatedAt: number;
  timeZone?: string;
  nationalExclusions?: readonly string[];
  limit?: number;
  browsingTimeCalibrated?: boolean;
};

export type MonthlyDocumentResult = {
  report: MonthlyReport;
  /** `.docx` listo para abrir en Word. */
  document: Uint8Array;
};

/** De los días acumulados al documento: modelo mensual y `.docx`. */
export function buildMonthlyDocument(
  input: MonthlyDocumentInput,
): MonthlyDocumentResult {
  const report = buildMonthlyReport({
    year: input.period.year,
    month: input.period.month,
    daily: input.days,
    nationalExclusions: input.nationalExclusions,
    limit: input.limit,
    browsingTimeCalibrated: input.browsingTimeCalibrated,
  });

  const document = buildReportDocument({
    template: input.template,
    traces: report.traces,
    period: input.period,
    generatedAt: input.generatedAt,
    timeZone: input.timeZone,
  });

  return { report, document };
}
