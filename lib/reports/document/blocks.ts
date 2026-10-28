/**
 * Bloques del cuerpo de `document.xml`: párrafos y tablas de primer nivel.
 *
 * Los dos módulos que reescriben el documento —el vaciado de las secciones 2-7 y
 * los campos del período— necesitan lo mismo: recorrer el cuerpo en orden y
 * reemplazar texto sin tocar el formato. Tenerlo en un solo lugar evita que las
 * dos copias se separen.
 *
 * El escaneo no es un parser XML: `document.xml` no tiene tablas anidadas y los
 * elementos son regulares. Un parser genérico agregaría una dependencia y
 * reescribiría atributos que después hay que comparar byte a byte.
 */

export const TABLE_PATTERN = /<w:tbl(?:\s[^>]*)?>[\s\S]*?<\/w:tbl>/g;
export const PARAGRAPH_PATTERN = /<w:p(?:\s[^>]*)?>[\s\S]*?<\/w:p>/g;

/** Contenido de los `<w:t>`, sin los atributos. */
const TEXT_CONTENT = /<w:t(?:\s[^>]*)?>([\s\S]*?)<\/w:t>/g;
/** `<w:t>` completo, con los atributos en el grupo 1. */
const TEXT_RUN = /<w:t(\s[^>]*)?>[\s\S]*?<\/w:t>/g;

export type Block =
  | {
      kind: "table";
      /** Índice de la tabla en el cuerpo, 1-based. */
      tableIndex: number;
      start: number;
      end: number;
      xml: string;
    }
  | { kind: "paragraph"; start: number; end: number; xml: string };

/** Texto visible de un párrafo o de un fragmento con `<w:t>`. */
export function paragraphText(fragment: string): string {
  return [...fragment.matchAll(TEXT_CONTENT)]
    .map((match) => match[1] ?? "")
    .join("")
    .trim();
}

/**
 * Reemplaza todo el texto de un párrafo por `text`.
 *
 * El texto va al primer `<w:t>` y el resto queda vacío: Word parte el texto en
 * runs arbitrarios (`'Ma'`, `'y'`, `'o'`), así que buscar la subcadena en un run
 * no es confiable. El formato se conserva porque los runs siguen ahí.
 */
export function replaceParagraphText(
  paragraphXml: string,
  text: string,
): string {
  let written = false;

  return paragraphXml.replace(TEXT_RUN, (_match, attributes: string) => {
    const opening = `<w:t${attributes ?? ""}>`;
    if (written) return `${opening}</w:t>`;
    written = true;
    return `${opening}${escapeXml(text)}</w:t>`;
  });
}

/** Vacía el texto de un fragmento conservando sus elementos. */
export function emptyText(fragment: string): string {
  return fragment.replace(
    TEXT_RUN,
    (_match, attributes: string) => `<w:t${attributes ?? ""}></w:t>`,
  );
}

export function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

/**
 * Bloques de primer nivel del cuerpo, en orden.
 *
 * Los párrafos que están dentro de una celda no aparecen: los devuelve su tabla.
 */
export function topLevelBlocks(documentXml: string): Block[] {
  const tables = [...documentXml.matchAll(TABLE_PATTERN)].map(
    (match, position) => ({
      kind: "table" as const,
      tableIndex: position + 1,
      start: match.index,
      end: match.index + match[0].length,
      xml: match[0],
    }),
  );

  const insideTable = (position: number) =>
    tables.some((table) => position >= table.start && position < table.end);

  const paragraphs = [...documentXml.matchAll(PARAGRAPH_PATTERN)]
    .filter((match) => !insideTable(match.index))
    .map((match) => ({
      kind: "paragraph" as const,
      start: match.index,
      end: match.index + match[0].length,
      xml: match[0],
    }));

  return [...tables, ...paragraphs].sort((a, b) => a.start - b.start);
}
