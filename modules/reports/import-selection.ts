/**
 * Selección de archivos para la importación de logs.
 *
 * El formulario acepta dos modos: archivos sueltos (`multiple`) o una carpeta
 * completa (`webkitdirectory`). En los dos casos el navegador entrega un
 * `FileList`; estas funciones lo filtran y lo ordenan antes de subir nada.
 *
 * El orden no es cosmético: el reloj de `Browsing Time` se corta en el borde
 * entre archivos (S12). Subir los días en orden cronológico mantiene el mismo
 * criterio que la importación manual, y un nombre con fecha (`squid-2026-10-01.log`)
 * ordena bien con comparación numérica.
 *
 * El filtro es por extensión del **nombre base**, no por la ruta: una carpeta
 * llamada `logs.log` no convierte en log a un `.png` que esté adentro. Se aceptan
 * `.log`, `.log.1` (rotados) y `.txt`; un `.log.gz` no se puede parsear y se
 * descarta.
 */

export type SelectableLogFile = {
  name: string;
  /** Ruta relativa que agrega `webkitdirectory`; vacía en el input de archivos. */
  webkitRelativePath?: string;
};

const LOG_FILE_PATTERN = /\.log(?:\.\d+)?$|\.txt$/i;

export function isLogFile(fileName: string): boolean {
  return LOG_FILE_PATTERN.test(fileName);
}

/** Nombre que se muestra y viaja al servidor: la ruta relativa si existe. */
export function relativeName(file: SelectableLogFile): string {
  const relative = file.webkitRelativePath?.trim();
  return relative !== undefined && relative.length > 0 ? relative : file.name;
}

export function sortLogFiles<T extends SelectableLogFile>(
  files: readonly T[],
): T[] {
  return [...files].sort((a, b) =>
    relativeName(a).localeCompare(relativeName(b), undefined, {
      numeric: true,
      sensitivity: "base",
    }),
  );
}

/**
 * Filtra los archivos que se pueden importar y cuenta los ignorados.
 *
 * Un archivo ignorado no es un error: la carpeta puede traer imágenes, `.gz` o
 * el `.DS_Store`. El usuario ve el conteo y decide si falta algo.
 */
export function filterLogFiles<T extends SelectableLogFile>(
  files: readonly T[],
): { accepted: T[]; ignored: number } {
  const accepted = files.filter((file) => isLogFile(file.name));

  return {
    accepted: sortLogFiles(accepted),
    ignored: files.length - accepted.length,
  };
}
