/**
 * Declaraciones de cobertura y de `Browsing Time` aproximado (S7, S12).
 *
 * El documento oficial no tiene una sección para ellas: son una nota de lectura
 * obligatoria, no un resultado. Van en un párrafo corto al cierre de la sección
 * 1, justo antes del encabezado que abre las secciones 2-7, para que quien lee
 * las trazas sepa con qué datos se calcularon antes de pasar a la prosa vacía.
 *
 * El párrafo se construye con el mismo formato del cuerpo del documento (Arial
 * 10 pt, interlineado 1.5, justificado), no con el estilo de los títulos.
 */

import { formatInteger } from "../format";
import type { MonthlyReport } from "../model/monthly";
import type { SkippedLines } from "../metrics/aggregate";import { DEFAULT_BLANK_SECTIONS } from "./blank-sections";
import { escapeXml, paragraphText, topLevelBlocks } from "./blocks";
import { MONTHS } from "./period";

/** Lo mínimo que la declaración necesita del modelo mensual. */
export type DeclarationInput = Pick<
  MonthlyReport,
  "period" | "coverage" | "declarations"
>;

/** A partir de esta cantidad de días, enumerarlos deja de ser legible. */
const MAX_LISTED_DAYS = 5;

type ParsedDay = { year: number; month: number; dayOfMonth: number };

function parseDay(day: string): ParsedDay {
  const [year, month, dayOfMonth] = day.split("-").map(Number);
  return { year, month, dayOfMonth };
}

/**
 * Lista días en prosa: `"3 y 4 de mayo"`, `"30 de abril"`.
 *
 * Cuando todos caen en el mismo mes se dice el mes una sola vez; un día ajeno
 * (el 30/04 en un informe de mayo) conserva el suyo.
 */
export function formatDayList(days: readonly string[]): string {
  const parsed = days.map(parseDay);
  const months = new Set(parsed.map((day) => `${day.year}-${day.month}`));

  if (months.size === 1) {
    const numbers = parsed.map((day) => day.dayOfMonth);
    const list =
      numbers.length === 1
        ? `${numbers[0]}`
        : `${numbers.slice(0, -1).join(", ")} y ${numbers.at(-1)}`;
    return `${list} de ${MONTHS[parsed[0].month - 1]}`;
  }

  return parsed
    .map((day) => `${day.dayOfMonth} de ${MONTHS[day.month - 1]}`)
    .join(", ");
}

function coverageSentence(report: DeclarationInput): string {
  const { expectedDays, presentDays, missingDays } = report.coverage;

  if (missingDays.length === 0) {
    return `Cobertura completa: ${formatInteger(presentDays)} de ${formatInteger(expectedDays)} días importados.`;
  }

  if (missingDays.length > MAX_LISTED_DAYS) {
    return `Cobertura incompleta: ${formatInteger(presentDays)} de ${formatInteger(expectedDays)} días importados; faltan ${formatInteger(missingDays.length)}.`;
  }

  const verb = missingDays.length === 1 ? "falta" : "faltan";
  return `Cobertura incompleta: ${formatInteger(presentDays)} de ${formatInteger(expectedDays)} días importados; ${verb} el ${formatDayList(missingDays)}.`;
}

function extraDaysSentence(report: DeclarationInput): string | null {
  const { extraDays } = report.coverage;

  if (extraDays.length === 0) return null;

  if (extraDays.length > MAX_LISTED_DAYS) {
    return `Se excluyeron ${formatInteger(extraDays.length)} días ajenos al período.`;
  }

  const verb = extraDays.length === 1 ? "Se excluyó" : "Se excluyeron";
  return `${verb} el ${formatDayList(extraDays)} por estar fuera del período.`;
}

function joinParts(parts: readonly string[]): string {
  if (parts.length <= 1) return parts.join("");
  return `${parts.slice(0, -1).join(", ")} y ${parts.at(-1)}`;
}

function skippedSentence(skipped: SkippedLines): string | null {
  const discarded: string[] = [];
  if (skipped.unserved > 0) {
    discarded.push(`${formatInteger(skipped.unserved)} respuestas no servidas`);
  }
  if (skipped.internal > 0) {
    discarded.push(
      `${formatInteger(skipped.internal)} accesos a destinos internos`,
    );
  }

  // La telemetría no se descarta: cuenta en Hits y Size. Solo se excluye de las
  // tablas de sitios, y eso hay que decirlo (S26).
  const sentences: string[] = [];
  if (discarded.length > 0) {
    sentences.push(`Se descartaron ${joinParts(discarded)}.`);
  }
  if (skipped.telemetry > 0) {
    sentences.push(
      `Se excluyeron de las tablas de sitios ${formatInteger(skipped.telemetry)} accesos de telemetría, que sí cuentan en los totales.`,
    );
  }

  if (sentences.length === 0) return null;
  return sentences.join(" ");
}

function browsingSentence(report: DeclarationInput): string | null {
  if (!report.declarations.browsingTimeApproximate) return null;

  return "El Browsing Time es aproximado: los relojes del proxy todavía no se calibraron contra WebSpy.";
}

/**
 * Texto de la nota de cierre de la sección 1.
 *
 * Cada oración se incluye solo si aplica: un mes completo y calibrado no declara
 * faltantes ni aproximación.
 */
export function buildDeclarationText(report: DeclarationInput): string {
  return [
    coverageSentence(report),
    extraDaysSentence(report),
    skippedSentence(report.declarations.skipped),
    browsingSentence(report),
  ]
    .filter((sentence): sentence is string => sentence !== null)
    .join(" ");
}

const RUN_PROPERTIES =
  '<w:rFonts w:ascii="Arial" w:hAnsi="Arial" w:cs="Arial"/><w:sz w:val="20"/><w:szCs w:val="20"/>';

function buildParagraph(text: string): string {
  return (
    "<w:p><w:pPr>" +
    '<w:spacing w:line="360" w:lineRule="auto"/><w:jc w:val="both"/>' +
    `<w:rPr>${RUN_PROPERTIES}</w:rPr>` +
    "</w:pPr>" +
    `<w:r><w:rPr>${RUN_PROPERTIES}</w:rPr>` +
    `<w:t xml:space="preserve">${escapeXml(text)}</w:t></w:r></w:p>`
  );
}

/**
 * Inserta la nota como párrafo propio antes del encabezado que abre las
 * secciones 2-7.
 *
 * Falla si el encabezado no aparece: emitir el informe sin la declaración es
 * publicar números sin decir con qué datos se calcularon.
 */
export function emitDeclaration(
  documentXml: string,
  text: string,
  anchor: string = DEFAULT_BLANK_SECTIONS.fromHeading,
): string {
  if (text.trim() === "") return documentXml;

  const target = topLevelBlocks(documentXml).find(
    (block) => block.kind === "paragraph" && paragraphText(block.xml) === anchor,
  );

  if (target === undefined) {
    throw new RangeError(
      `no se encontró el párrafo donde va la declaración: ${anchor}`,
    );
  }

  return (
    documentXml.slice(0, target.start) +
    buildParagraph(text) +
    documentXml.slice(target.start)
  );
}
