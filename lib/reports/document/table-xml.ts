/**
 * Reemplazo de las filas de datos de una tabla dentro de `document.xml`.
 *
 * El documento oficial se usa como plantilla: no se reconstruye el formato, se
 * clonan las filas que ya existen. Así el resultado hereda bordes, anchos,
 * fuentes, alineación y estilos exactos del original, que es la única forma
 * razonable de que el PDF sea indistinguible.
 *
 * No se usa un parser XML completo a propósito: `document.xml` trae más de
 * 400 KB y los 22 elementos que interesan son regulares (`w:tbl`, `w:tr`,
 * `w:tc`, `w:t`) sin tablas anidadas. Un parser genérico agregaría una
 * dependencia y reescribiría namespaces y atributos que después hay que volver
 * a comparar byte a byte.
 */

export type ReplaceTableOptions = {
  /** Índice de la tabla en el cuerpo del documento, 1-based. */
  tableIndex: number;
  /** Una fila de textos por fila de datos. La primera fila (cabecera) no se toca. */
  rows: readonly (readonly string[])[];
  /** Fila que se clona como molde. 1 = primera fila de datos. */
  prototypeRowIndex?: number;
};

const TABLE_PATTERN = /<w:tbl(?:\s[^>]*)?>[\s\S]*?<\/w:tbl>/g;
const ROW_PATTERN = /<w:tr(?:\s[^>]*)?>[\s\S]*?<\/w:tr>/g;
const CELL_PATTERN = /<w:tc(?:\s[^>]*)?>[\s\S]*?<\/w:tc>/g;
const TEXT_PATTERN = /<w:t(\s[^>]*)?>[\s\S]*?<\/w:t>/g;

export function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function setCellText(cellXml: string, text: string): string {
  let written = false;

  const replaced = cellXml.replace(TEXT_PATTERN, (_match, attributes: string) => {
    const opening = `<w:t${attributes ?? ""}>`;
    if (written) return `${opening}</w:t>`;
    written = true;
    return `${opening}${escapeXml(text)}</w:t>`;
  });

  if (written) return replaced;

  // Celda sin texto: se le agrega un párrafo con una única corrida.
  return replaced.replace(
    "</w:tc>",
    `<w:p><w:r><w:t>${escapeXml(text)}</w:t></w:r></w:p></w:tc>`,
  );
}

function fillRow(rowXml: string, values: readonly string[]): string {
  let index = 0;

  return rowXml.replace(CELL_PATTERN, (cellXml) => {
    const value = values[index];
    index += 1;
    if (value === undefined) {
      throw new RangeError(
        `la fila tiene más celdas que valores (${values.length} valores)`,
      );
    }
    return setCellText(cellXml, value);
  });
}

function countCells(rowXml: string): number {
  return [...rowXml.matchAll(CELL_PATTERN)].length;
}

function replaceInTable(tableXml: string, options: ReplaceTableOptions): string {
  const matches = [...tableXml.matchAll(ROW_PATTERN)];
  const rows = matches.map((match) => match[0]);

  if (matches.length === 0) {
    throw new RangeError(`la tabla ${options.tableIndex} no tiene filas`);
  }

  const prototypeIndex = options.prototypeRowIndex ?? 1;
  const prototype = rows[prototypeIndex];
  if (prototype === undefined) {
    throw new RangeError(
      `la tabla ${options.tableIndex} no tiene fila molde ${prototypeIndex}`,
    );
  }

  const expected = countCells(prototype);
  for (const values of options.rows) {
    if (values.length !== expected) {
      throw new RangeError(
        `la tabla ${options.tableIndex} espera ${expected} celdas y llegó una fila con ${values.length}`,
      );
    }
  }

  const generated = options.rows.map((values) => fillRow(prototype, values));

  // La cabecera (fila 0) queda como está; se reemplaza desde la fila 1 hasta la
  // última, usando las posiciones reales para no confundir filas idénticas.
  const firstData = matches[1];
  const last = matches[matches.length - 1];
  if (firstData?.index === undefined || last?.index === undefined) {
    throw new RangeError("no se pudo ubicar el bloque de filas de datos");
  }

  const start = firstData.index;
  const end = last.index + last[0].length;

  return tableXml.slice(0, start) + generated.join("") + tableXml.slice(end);
}

/** Reemplaza las filas de datos de una tabla. La cabecera queda intacta. */
export function replaceTableBodyRows(
  documentXml: string,
  options: ReplaceTableOptions,
): string {
  let tableIndex = 0;
  let done = false;

  const result = documentXml.replace(TABLE_PATTERN, (tableXml) => {
    tableIndex += 1;
    if (tableIndex !== options.tableIndex) return tableXml;
    done = true;
    return replaceInTable(tableXml, options);
  });

  if (!done) {
    throw new RangeError(`no existe la tabla ${options.tableIndex}`);
  }

  return result;
}
