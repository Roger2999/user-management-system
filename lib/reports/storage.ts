import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

/**
 * Archivos del informe: la plantilla oficial y los `.docx` emitidos.
 *
 * La plantilla no se versiona en el repositorio: es el documento oficial de la
 * empresa. Se configura con `REPORTS_TEMPLATE_PATH` y, si no está, se busca en
 * `storage/templates/monthly-report.docx`. Los documentos emitidos viven fuera
 * de `public/` a propósito: llevan datos de navegación de personas y solo se
 * sirven por una ruta autenticada.
 */

/** Se sube cuando cambia la plantilla oficial, para poder auditar qué se emitió. */
export const TEMPLATE_VERSION = 1;

export function templatePath(): string {
  const configured = process.env.REPORTS_TEMPLATE_PATH?.trim();
  return (
    configured !== undefined && configured.length > 0
      ? configured
      : path.join(process.cwd(), "storage", "templates", "monthly-report.docx")
  );
}

export function reportsDir(): string {
  const configured = process.env.REPORTS_STORAGE_DIR?.trim();
  return configured !== undefined && configured.length > 0
    ? configured
    : path.join(process.cwd(), "storage", "reports");
}

function fileNameFor(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, "0")}.docx`;
}

export async function readTemplate(): Promise<Uint8Array> {
  return readFile(templatePath());
}

export async function writeReportDocument(
  year: number,
  month: number,
  bytes: Uint8Array,
): Promise<void> {
  await mkdir(reportsDir(), { recursive: true });
  await writeFile(path.join(reportsDir(), fileNameFor(year, month)), bytes);
}

export async function readReportDocument(
  year: number,
  month: number,
): Promise<Uint8Array> {
  return readFile(path.join(reportsDir(), fileNameFor(year, month)));
}
