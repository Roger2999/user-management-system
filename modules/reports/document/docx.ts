import { readZip, writeZip, type ZipEntry } from "./zip";

/**
 * Acceso a las partes de un `.docx` que importan para el informe.
 *
 * Un `.docx` es un ZIP con partes XML. Todo el formato vive en
 * `word/document.xml` y sus relaciones; el resto (`styles.xml`, fuentes, tema,
 * numeración, medios) se conserva tal cual. Por eso no se reconstruye el
 * documento: se reemplaza una parte y se vuelve a comprimir.
 */

export const DOCUMENT_PART = "word/document.xml";

const encoder = new TextEncoder();

export function readDocx(bytes: Uint8Array): ZipEntry[] {
  return readZip(bytes);
}

function findDocumentPart(entries: readonly ZipEntry[]): ZipEntry {
  const part = entries.find((entry) => entry.name === DOCUMENT_PART);
  if (part === undefined) {
    throw new RangeError(`el .docx no tiene la parte ${DOCUMENT_PART}`);
  }
  return part;
}

export function readDocumentXml(bytes: Uint8Array): string {
  const entries = readDocx(bytes);
  return new TextDecoder().decode(findDocumentPart(entries).data);
}

/** Reemplaza solo `word/document.xml` y conserva el resto de las partes. */
export function replaceDocumentXml(bytes: Uint8Array, xml: string): Uint8Array {
  const entries = readDocx(bytes);
  const replaced = entries.map((entry) =>
    entry.name === DOCUMENT_PART
      ? { name: entry.name, data: encoder.encode(xml) }
      : entry,
  );

  // Falla explícito si la parte no estaba: reemplazar nada sería un documento
  // sin cambios que parece generado.
  findDocumentPart(replaced);

  return writeZip(replaced);
}
