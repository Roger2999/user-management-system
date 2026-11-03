/**
 * Composición del documento mensual.
 *
 * La plantilla v2 es un formulario: el generador solo reemplaza las tablas 6-8
 * y fecha el documento. No hay vaciado genérico porque las secciones manuales
 * ya vienen en blanco y una regla automática destruiría los `Si ____ / No ____`.
 *
 * Orden: tablas, campos del período y, al final, la nota de cobertura. La nota
 * se inserta después de fechar para que no pase por el reemplazo de años.
 *
 * El documento no se reconstruye: se parte del `.docx` oficial y se reescribe
 * `word/document.xml`. Es la única forma de que el PDF salga indistinguible.
 */

import type {
  TracesSection,
  UserProfiles,
} from "./assembly/section-traces";
import type { DailyMetrics } from "./metrics/aggregate";
import { buildDeclarationText, emitDeclaration } from "./document/declarations";
import { buildMonthlyReport, type MonthlyReport } from "./model/monthly";
import { DEFAULT_TIME_ZONE } from "./time";
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
  /**
   * Nota de cobertura y `Browsing Time` (S7, S12). Se inserta al cierre de la
   * sección 1. Sin texto no se agrega párrafo.
   */
  declaration?: string;
};

/** Devuelve el `.docx` del informe listo para abrir en Word. */
export function buildReportDocument(input: ReportDocumentInput): Uint8Array {
  const xml = readDocumentXml(input.template);

  const withTraces = emitTracesSection(xml, input.traces);

  const dated = fillPeriodFields(withTraces, {
    month: input.period.month,
    year: input.period.year,
    generatedAt: input.generatedAt,
    timeZone: input.timeZone ?? DEFAULT_TIME_ZONE,
  });

  // La nota se inserta después de fechar: no es un campo del período y no debe
  // pasar por el reemplazo de meses de la prosa.
  const declared =
    input.declaration === undefined
      ? dated
      : emitDeclaration(dated, input.declaration);

  return replaceDocumentXml(input.template, declared);
}

export type MonthlyDocumentInput = {
  /** Bytes del `.docx` oficial, sin modificar. */
  template: Uint8Array;
  /** Días ya acumulados por `ingestSquidLog`. */
  days: readonly DailyMetrics[];
  period: { year: number; month: number };
  generatedAt: number;
  timeZone?: string;
  /** Perfiles por `username` en minúsculas; los resuelve la capa de generación. */
  profiles?: UserProfiles;
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
    profiles: input.profiles,
    limit: input.limit,
    browsingTimeCalibrated: input.browsingTimeCalibrated,
  });

  const document = buildReportDocument({
    template: input.template,
    traces: report.traces,
    period: input.period,
    generatedAt: input.generatedAt,
    timeZone: input.timeZone,
    declaration: buildDeclarationText(report),
  });

  return { report, document };
}
