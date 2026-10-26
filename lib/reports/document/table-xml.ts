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
  const firstPrototype = rows[prototypeIndex];
  if (firstPrototype === undefined) {
    throw new RangeError(
      `la tabla ${options.tableIndex} no tiene fila molde ${prototypeIndex}`,
    );
  }

  // Las filas de datos alternan `cnfStyle` (banda impar / banda par) y el estilo
  // `WebSpyTable` pinta el zebra con eso. Clonar siempre la primera fila pinta
  // todas iguales: se ve en el PDF aunque el texto sea idéntico.
  //
  // La última fila no es una banda: lleva `lastRow`, que es lo que dibuja el
  // borde inferior de la tabla. Por eso el último renglón se clona de la última
  // fila original y no del molde de banda.
  const secondPrototype = rows[prototypeIndex + 1] ?? firstPrototype;
  const lastPrototype = rows[rows.length - 1];

  const expected = countCells(firstPrototype);
  for (const values of options.rows) {
    if (values.length !== expected) {
      throw new RangeError(
        `la tabla ${options.tableIndex} espera ${expected} celdas y llegó una fila con ${values.length}`,
      );
    }
  }

  const generated = options.rows.map((values, position) => {
    const isLast = position === options.rows.length - 1;
    const prototype = isLast
      ? lastPrototype
      : position % 2 === 0
        ? firstPrototype
        : secondPrototype;

    return fillRow(prototype, values);
  });

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
  const table = findTable(documentXml, options.tableIndex);
  const replaced = replaceInTable(table.xml, options);

  return documentXml.slice(0, table.start) + replaced + documentXml.slice(table.end);
}

type TableSpan = { index: number; start: number; end: number; xml: string };

function findTables(documentXml: string): TableSpan[] {
  return [...documentXml.matchAll(TABLE_PATTERN)].map((match, position) => ({
    index: position + 1,
    start: match.index,
    end: match.index + match[0].length,
    xml: match[0],
  }));
}

function findTable(documentXml: string, tableIndex: number): TableSpan {
  const table = findTables(documentXml)[tableIndex - 1];

  if (table === undefined) {
    throw new RangeError(`no existe la tabla ${tableIndex}`);
  }

  return table;
}

export type ReplaceTableHeaderOptions = {
  tableIndex: number;
  /** Textos de la cabecera, en el orden de las columnas. */
  values: readonly string[];
};

/**
 * Reescribe la cabecera de una tabla.
 *
 * Hace falta para normalizar `% of Hits` a `% of Browsing Time (h:m:s)` en los
 * dos drill-downs que el documento de mayo exportó por hits (S21).
 */
export function replaceTableHeaderRow(
  documentXml: string,
  options: ReplaceTableHeaderOptions,
): string {
  const table = findTable(documentXml, options.tableIndex);
  const header = [...table.xml.matchAll(ROW_PATTERN)][0];

  if (header?.index === undefined) {
    throw new RangeError(`la tabla ${options.tableIndex} no tiene cabecera`);
  }

  if (countCells(header[0]) !== options.values.length) {
    throw new RangeError(
      `la tabla ${options.tableIndex} espera ${countCells(header[0])} celdas de cabecera y llegaron ${options.values.length}`,
    );
  }

  const replaced =
    table.xml.slice(0, header.index) +
    fillRow(header[0], options.values) +
    table.xml.slice(header.index + header[0].length);

  return documentXml.slice(0, table.start) + replaced + documentXml.slice(table.end);
}

const PARAGRAPH_PATTERN = /<w:p(?:\s[^>]*)?>[\s\S]*?<\/w:p>/g;
const GRID_PATTERN = /<w:tblGrid>[\s\S]*?<\/w:tblGrid>/;

export type CopyTableGridOptions = {
  tableIndex: number;
  /** Tabla de la que se copian los anchos de columna. */
  referenceTableIndex: number;
};

/** Textos de la fila de cabecera, en orden de columna. */
export function readTableHeader(
  documentXml: string,
  tableIndex: number,
): string[] {
  const table = findTable(documentXml, tableIndex);
  const header = [...table.xml.matchAll(ROW_PATTERN)][0];

  if (header === undefined) {
    throw new RangeError(`la tabla ${tableIndex} no tiene cabecera`);
  }

  return [...header[0].matchAll(CELL_PATTERN)].map((cell) => textOf(cell[0]));
}

function textOf(fragment: string): string {
  return [...fragment.matchAll(/<w:t(?:\s[^>]*)?>([\s\S]*?)<\/w:t>/g)]
    .map((match) => match[1] ?? "")
    .join("")
    .trim();
}

/**
 * Copia los anchos de columna de otra tabla.
 *
 * Hace falta al normalizar los drill-downs: `clarity.ms` y `windy.com` vienen con
 * la última columna a 875 twips, dimensionada para `% of Hits`, contra 2255 en
 * las otras ocho. Si solo se cambia el texto, la cabecera larga se parte en
 * cuatro líneas, la tabla crece y se corre la paginación de todo lo que sigue.
 */
export function copyTableGrid(
  documentXml: string,
  options: CopyTableGridOptions,
): string {
  const target = findTable(documentXml, options.tableIndex);
  const reference = findTable(documentXml, options.referenceTableIndex);
  const grid = reference.xml.match(GRID_PATTERN)?.[0];

  if (grid === undefined) {
    throw new RangeError(
      `la tabla ${options.referenceTableIndex} no tiene tblGrid`,
    );
  }

  if (!GRID_PATTERN.test(target.xml)) {
    throw new RangeError(`la tabla ${options.tableIndex} no tiene tblGrid`);
  }

  const replaced = target.xml.replace(GRID_PATTERN, grid);

  return documentXml.slice(0, target.start) + replaced + documentXml.slice(target.end);
}

function setParagraphText(paragraphXml: string, text: string): string {
  let written = false;

  const replaced = paragraphXml.replace(TEXT_PATTERN, (_match, attributes: string) => {
    const opening = `<w:t${attributes ?? ""}>`;
    if (written) return `${opening}</w:t>`;
    written = true;
    return `${opening}${escapeXml(text)}</w:t>`;
  });

  if (written) return replaced;

  return replaced.replace(
    "</w:p>",
    `<w:r><w:t>${escapeXml(text)}</w:t></w:r></w:p>`,
  );
}

type ParagraphSpan = { start: number; end: number; xml: string };

/** Párrafo inmediatamente anterior a la tabla, sin nada más entre los dos. */
function findHeadingBeforeTable(
  documentXml: string,
  table: TableSpan,
): ParagraphSpan {
  const prefix = documentXml.slice(0, table.start);
  const matches = [...prefix.matchAll(PARAGRAPH_PATTERN)];
  const last = matches[matches.length - 1];

  if (last?.index === undefined) {
    throw new RangeError(`la tabla ${table.index} no tiene párrafo anterior`);
  }

  const gap = prefix.slice(last.index + last[0].length);
  if (gap.trim() !== "") {
    throw new RangeError(
      `la tabla ${table.index} no tiene un párrafo inmediatamente anterior`,
    );
  }

  return { start: last.index, end: last.index + last[0].length, xml: last[0] };
}

export type SetTableHeadingOptions = {
  tableIndex: number;
  text: string;
};

/** Cambia el texto del párrafo que titula la tabla (el nombre del sitio). */
export function setTableHeading(
  documentXml: string,
  options: SetTableHeadingOptions,
): string {
  const table = findTable(documentXml, options.tableIndex);
  const heading = findHeadingBeforeTable(documentXml, table);
  const replaced = setParagraphText(heading.xml, options.text);

  return (
    documentXml.slice(0, heading.start) + replaced + documentXml.slice(heading.end)
  );
}

/**
 * Elimina una tabla y el párrafo que la titula.
 *
 * Se usa cuando la selección tiene menos drill-downs que ranuras tiene la
 * plantilla: dejar tablas vacías de sitios que no se informan sería peor que no
 * emitirlas.
 */
export function removeTableWithHeading(
  documentXml: string,
  tableIndex: number,
): string {
  const table = findTable(documentXml, tableIndex);
  const heading = findHeadingBeforeTable(documentXml, table);

  return documentXml.slice(0, heading.start) + documentXml.slice(table.end);
}
