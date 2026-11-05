/**
 * Campos del período en la plantilla oficial v2.
 *
 * La plantilla trae cuatro lugares que dependen del mes: el título, el rango
 * `Período del Informe:`, la `Fecha de Emisión:` y el cierre de firma. Los
 * huecos manuales con año (`___/____/202_`) también se completan con el año del
 * período.
 *
 * La fecha de emisión se calcula en la zona de la entidad: generando a las 22:00
 * de La Habana, un `new Date()` en UTC ya es el día siguiente y el documento
 * saldría fechado un día después. La fecha no se deduce del período: un informe
 * de octubre puede emitirse en noviembre.
 *
 * Falla si falta un ancla: emitir el documento con el mes de la plantilla es un
 * error que nadie nota hasta que el informe está firmado.
 */

import { DEFAULT_TIME_ZONE, monthlyPeriod, toLocalDay } from "../time";
import {
  emptyText,
  paragraphText,
  replaceParagraphText,
  replaceTextInRuns,
  topLevelBlocks,
} from "./blocks";

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

const TITLE_PREFIX = "Informe Mensual de Ciberseguridad.";
const PERIOD_LABEL = "Período del Informe:";
const EMISSION_LABEL = "Fecha de Emisión:";
const CLOSING_PREFIX = "Y para que así conste se firma la presente";

const RUN_PATTERN = /<w:r(?:\s[^>]*)?>[\s\S]*?<\/w:r>/g;

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

/** `"2026-10-01"` → `"01/10/2026"`. */
function formatIsoDate(iso: string): string {
  const [year, month, day] = iso.split("-");
  return `${day}/${month}/${year}`;
}

const TEXT_CONTENT = /<w:t(?:\s[^>]*)?>([\s\S]*?)<\/w:t>/g;

/** Texto de los `<w:t>` de un run, sin recortar espacios. */
function rawText(fragment: string): string {
  return [...fragment.matchAll(TEXT_CONTENT)]
    .map((match) => match[1] ?? "")
    .join("");
}

/**
 * Reemplaza el texto que sigue a `label` dentro del párrafo.
 *
 * El documento parte la etiqueta y el valor en runs distintos
 * (`Fecha de Emisión:` + ` 9/ 11/ 2026`), pero un párrafo sintético puede
 * traerlos en el mismo run. En los dos casos se conserva el prefijo y el
 * formato: se reescribe desde donde termina la etiqueta y se vacían las
 * corridas posteriores.
 */
function replaceValueAfterLabel(
  paragraphXml: string,
  label: string,
  value: string,
): string {
  const runs = [...paragraphXml.matchAll(RUN_PATTERN)].map((match) => ({
    xml: match[0],
    index: match.index as number,
    text: rawText(match[0]),
  }));

  const fullText = runs.map((run) => run.text).join("");
  const labelStart = fullText.indexOf(label);

  if (labelStart < 0) {
    throw new RangeError(`no se encontró la etiqueta: ${label}`);
  }

  const labelEnd = labelStart + label.length;
  let position = 0;
  let cursor = 0;
  let replaced = false;
  let out = "";

  for (const run of runs) {
    const start = position;
    const end = position + run.text.length;
    position = end;

    out += paragraphXml.slice(cursor, run.index);
    cursor = run.index + run.xml.length;

    if (replaced) {
      out += emptyText(run.xml);
      continue;
    }

    if (end <= labelEnd) {
      out += run.xml;
      continue;
    }

    if (start < labelEnd) {
      const prefix = run.text.slice(0, labelEnd - start);
      const suffix = run.text.slice(labelEnd - start);
      out += replaceParagraphText(
        run.xml,
        prefix + (/^\s/.test(suffix) ? ` ${value}` : value),
      );
    } else {
      out += replaceParagraphText(
        run.xml,
        /^\s/.test(run.text) ? ` ${value}` : value,
      );
    }

    replaced = true;
  }

  if (!replaced) {
    throw new RangeError(`no se encontró el valor después de: ${label}`);
  }

  out += paragraphXml.slice(cursor);
  return out;
}

/**
 * Llena el título, el rango, la fecha de emisión y el cierre.
 *
 * Los años de los huecos manuales se completan con el año del período para que
 * el formulario no quede con un `202_` a medio escribir.
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

  const emissionMonthName = MONTHS[Number(emissionMonth) - 1];
  const period = monthlyPeriod(spec.year, spec.month);
  const firstDay = period.days[0];
  const lastDay = period.days.at(-1);

  if (firstDay === undefined || lastDay === undefined) {
    throw new RangeError(`período sin días: ${spec.year}-${spec.month}`);
  }

  const titleLine = `${TITLE_PREFIX} ${capitalize(monthName)} ${spec.year} v. Final.`;
  const periodLine = `${formatIsoDate(firstDay)} al ${formatIsoDate(lastDay)}`;
  const emissionLine = `${emissionDay}/${emissionMonth}/${emissionYear}`;
  const closingLine =
    `Y para que así conste se firma la presente a los ${Number(emissionDay)} ` +
    `días del mes de ${emissionMonthName} del año ${emissionYear}`;
  const year = String(spec.year);

  let titled = false;
  let periodSet = false;
  let emissionSet = false;
  let closed = false;
  let out = "";
  let cursor = 0;

  for (const block of topLevelBlocks(documentXml)) {
    out += documentXml.slice(cursor, block.start);
    cursor = block.end;

    if (block.kind !== "paragraph") {
      // Las tablas manuales (respaldos, antivirus) traen `___/____/202_`; el año
      // se completa sin tocar el resto de la celda.
      out += replaceTextInRuns(block.xml, "202_", year);
      continue;
    }

    const text = paragraphText(block.xml);

    if (text.startsWith(TITLE_PREFIX)) {
      out += replaceParagraphText(block.xml, titleLine);
      titled = true;
    } else if (text.includes(PERIOD_LABEL)) {
      out += replaceValueAfterLabel(block.xml, PERIOD_LABEL, periodLine);
      periodSet = true;
    } else if (text.includes(EMISSION_LABEL)) {
      out += replaceValueAfterLabel(block.xml, EMISSION_LABEL, emissionLine);
      emissionSet = true;
    } else if (text.startsWith(CLOSING_PREFIX)) {
      out += replaceParagraphText(block.xml, closingLine);
      closed = true;
    } else {
      out += replaceTextInRuns(block.xml, "202_", year);
    }
  }

  out += documentXml.slice(cursor);

  if (!titled) {
    throw new RangeError("no se encontró el título del informe");
  }
  if (!periodSet) {
    throw new RangeError("no se encontró el período del informe");
  }
  if (!emissionSet) {
    throw new RangeError("no se encontró la fecha de emisión");
  }
  if (!closed) {
    throw new RangeError("no se encontró el cierre de firma");
  }

  return out;
}
