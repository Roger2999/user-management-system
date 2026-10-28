/**
 * Vaciado de las secciones 2-7 del documento oficial (S6).
 *
 * El informe se llena solo en la sección 1. Las otras seis se emiten presentes y
 * vacías: se conservan los encabezados numerados, la numeración, las etiquetas de
 * plantilla y las cabeceras de tabla; se borran los valores del mes anterior.
 *
 * La regla sobre la prosa no puede ser genérica: en este documento etiqueta y
 * valor comparten run ("Cantidad de máquinas afectadas: 10", "detectados__10___").
 * Por eso se declara el corte y se verifica contra el documento real:
 *
 * 1. párrafo con `@` (correos) → se vacía;
 * 2. párrafo que es solo un identificador en mayúsculas (nombres de PC) → se vacía;
 * 3. se borra el contenido de los huecos con guiones bajos (`__10___` → `_______`);
 * 4. se corta en el último `:` y se conserva la etiqueta;
 * 5. un guion suelto al final es un relleno de "sin dato" y se descarta.
 *
 * Un párrafo sin separador se conserva: es prosa de plantilla. Eso incluye la
 * frase de cierre del IDS ("Hasta la fecha no se detectan alertas..."), que el
 * especialista tiene que revisar cada mes porque afirma un resultado, no una
 * regla.
 */

import {
  emptyText,
  paragraphText,
  replaceParagraphText,
  topLevelBlocks,
} from "./blocks";

const ROW_PATTERN = /<w:tr(?:\s[^>]*)?>[\s\S]*?<\/w:tr>/g;

/** Una tabla de las secciones 2-7 y cuántas filas de arriba son cabecera. */
export type BlankTableSpec = {
  /** Índice de la tabla en el cuerpo del documento, 1-based. */
  tableIndex: number;
  /**
   * Filas que se conservan. La tabla 22 del resumen tiene tres (títulos, grupos
   * y subgrupos); la 19 de virus no tiene ninguna porque es una lista.
   */
  headerRows: number;
};

export type BlankSectionsSpec = {
  /** Párrafo que abre las secciones 2-7. Todo lo anterior no se toca. */
  fromHeading: string;
  tables: readonly BlankTableSpec[];
};

export const DEFAULT_BLANK_SECTIONS: BlankSectionsSpec = {
  fromHeading: "Uso de correo por webmail en servidores nacionales:",
  tables: [
    { tableIndex: 18, headerRows: 2 },
    { tableIndex: 19, headerRows: 0 },
    { tableIndex: 20, headerRows: 1 },
    { tableIndex: 21, headerRows: 1 },
    { tableIndex: 22, headerRows: 3 },
  ],
};

const IDENTIFIER = /^[A-ZÁÉÍÓÚÜÑ0-9_\-\s]+$/;
const UNDERSCORE_VALUE = /_{1,}[^_\s]{1,4}_{1,}/g;
const TRAILING_DASH = /\s+[-–]\s*$/;

function isIdentifierList(text: string): boolean {
  return IDENTIFIER.test(text) && /[A-ZÁÉÍÓÚÜÑ]/.test(text);
}

/** Borra lo que está escrito dentro de un hueco de guiones bajos. */
function clearUnderscoreValues(text: string): string {
  return text.replace(UNDERSCORE_VALUE, (match) => "_".repeat(match.length));
}

/**
 * Texto que debe quedar en un párrafo de las secciones 2-7.
 *
 * Devuelve el texto completo cuando no hay nada que vaciar, para no reescribir el
 * párrafo y no perder formato sin necesidad.
 */
export function blankParagraphText(text: string): string {
  const trimmed = text.trim();

  if (trimmed === "") return trimmed;
  if (trimmed.includes("@")) return "";
  if (isIdentifierList(trimmed)) return "";

  let target = clearUnderscoreValues(trimmed);
  const colon = target.lastIndexOf(":");
  if (colon >= 0) {
    target = target.slice(0, colon + 1);
  } else {
    target = target.replace(TRAILING_DASH, "");
  }

  return target;
}

function blankParagraph(paragraphXml: string): string {
  const text = paragraphText(paragraphXml);
  const target = blankParagraphText(text);

  if (target === text) return paragraphXml;

  return replaceParagraphText(paragraphXml, target);
}

function blankTableRows(tableXml: string, headerRows: number): string {
  const rows = [...tableXml.matchAll(ROW_PATTERN)];

  if (headerRows > rows.length) {
    throw new RangeError(
      `la tabla declara ${headerRows} filas de cabecera y tiene ${rows.length}`,
    );
  }

  let out = "";
  let cursor = 0;

  rows.forEach((row, index) => {
    out += tableXml.slice(cursor, row.index);
    out += index < headerRows ? row[0] : emptyText(row[0]);
    cursor = row.index + row[0].length;
  });

  return out + tableXml.slice(cursor);
}

/**
 * Vuelve vacías las secciones 2-7 conservando encabezados, numeración, etiquetas
 * y cabeceras de tabla.
 *
 * Falla si el encabezado que abre las secciones no aparece o si hay una tabla
 * después de él que no esté declarada: dejarla intacta sería publicar los datos
 * del mes anterior en un informe nuevo.
 */
export function blankSections(
  documentXml: string,
  spec: BlankSectionsSpec = DEFAULT_BLANK_SECTIONS,
): string {
  const blocks = topLevelBlocks(documentXml);
  const start = blocks.findIndex(
    (block) =>
      block.kind === "paragraph" && paragraphText(block.xml) === spec.fromHeading,
  );

  if (start < 0) {
    throw new RangeError(
      `no se encontró el encabezado que abre las secciones 2-7: ${spec.fromHeading}`,
    );
  }

  const declared = new Map(
    spec.tables.map((table) => [table.tableIndex, table.headerRows]),
  );

  let out = "";
  let cursor = 0;

  blocks.forEach((block, position) => {
    out += documentXml.slice(cursor, block.start);

    if (position < start) {
      out += block.xml;
    } else if (block.kind === "paragraph") {
      out += blankParagraph(block.xml);
    } else {
      const headerRows = declared.get(block.tableIndex);

      if (headerRows === undefined) {
        throw new RangeError(
          `la tabla ${block.tableIndex} está en las secciones 2-7 y no está declarada`,
        );
      }

      out += blankTableRows(block.xml, headerRows);
    }

    cursor = block.end;
  });

  return out + documentXml.slice(cursor);
}
