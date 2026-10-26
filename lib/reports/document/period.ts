/**
 * Campos del período en el documento oficial.
 *
 * El documento de la plantilla trae tres lugares con el mes: la fecha de emisión
 * ("Matanzas, 9 de Mayo de 2026"), la línea del informe ("Informe mensual
 * correspondiente al mes mayo de 2026") y la prosa de la sección 1 ("En la
 * evaluación de las trazas del mes de Mayo...").
 *
 * Los tres se reescriben a partir del período informado y de la fecha de
 * generación. La fecha se calcula en la zona de la entidad: generando a las 22:00
 * de La Habana, un `new Date()` en UTC ya es el día siguiente, y el documento
 * saldría fechado un día después.
 *
 * La fecha no se deduce del período: un informe de mayo puede emitirse en junio.
 */

import { DEFAULT_TIME_ZONE, toLocalDay } from "../time";
import { paragraphText, replaceParagraphText, topLevelBlocks } from "./blocks";

export const MONTHS = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
] as const;

export type PeriodFieldsSpec = {
  /** Mes del informe, 1-12. */
  month: number;
  year: number;
  /** Instante de emisión. La fecha del documento se calcula en la zona local. */
  generatedAt: number;
  timeZone?: string;
};

const DATE_LINE = /^Matanzas,\s+\d{1,2}\s+de\s+\p{L}+\s+de\s+\d{4}$/u;
const REPORT_LINE = /^Informe mensual correspondiente al mes\b/i;
const MONTH_IN_PROSE =
  /\b(mes de\s+)(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)\b/i;

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

/**
 * Llena la fecha, la línea del mes y la mención del mes en la prosa.
 *
 * Falla si no encuentra la fecha o la línea del informe: emitir el documento con
 * el mes de la plantilla es un error que nadie nota hasta que el informe está
 * firmado.
 */
export function fillPeriodFields(
  documentXml: string,
  spec: PeriodFieldsSpec,
): string {
  const monthName = MONTHS[spec.month - 1];

  if (!monthName) {
    throw new RangeError(`mes fuera de rango: ${spec.month}`);
  }

  if (!Number.isInteger(spec.year)) {
    throw new RangeError(`año inválido: ${spec.year}`);
  }

  const [emissionYear, emissionMonth, emissionDay] = toLocalDay(
    spec.generatedAt,
    spec.timeZone ?? DEFAULT_TIME_ZONE,
  ).split("-");

  // La fecha del documento es la de emisión, no la del período: un informe de
  // mayo puede firmarse en junio.
  const emissionMonthName = MONTHS[Number(emissionMonth) - 1];

  const dateLine = `Matanzas, ${Number(emissionDay)} de ${capitalize(emissionMonthName)} de ${emissionYear}`;
  const reportLine = `Informe mensual correspondiente al mes ${monthName} de ${spec.year}`;

  let dated = false;
  let titled = false;
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

    if (DATE_LINE.test(text)) {
      out += replaceParagraphText(block.xml, dateLine);
      dated = true;
    } else if (REPORT_LINE.test(text)) {
      out += replaceParagraphText(block.xml, reportLine);
      titled = true;
    } else if (MONTH_IN_PROSE.test(text)) {
      out += replaceParagraphText(
        block.xml,
        text.replace(
          MONTH_IN_PROSE,
          (_match, prefix: string) => prefix + capitalize(monthName),
        ),
      );
    } else {
      out += block.xml;
    }
  }

  out += documentXml.slice(cursor);

  if (!dated) {
    throw new RangeError("no se encontró la fecha del documento");
  }

  if (!titled) {
    throw new RangeError("no se encontró la línea del mes del informe");
  }

  return out;
}
