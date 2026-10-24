import { createInterface } from "node:readline";
import type { ParseStats, SquidLogRecord } from "../types";

/**
 * Parser de `access.log` de Squid.
 *
 * Las columnas se declaran por posición y no se adivinan: si el servidor usa un
 * `logformat` propio, se cambia el arreglo de columnas y listo. Si el orden
 * declarado no coincide con el archivo, el parser **rechaza las líneas** en
 * lugar de interpretar mal los campos, porque un número creíble y equivocado es
 * peor que un error visible.
 */

export type SquidLogColumn =
  | "timestamp"
  | "elapsed"
  | "clientIp"
  | "status"
  | "bytes"
  | "method"
  | "url"
  | "username"
  | "hierarchy"
  | "contentType";

/** Directiva del `squid.conf` que produce cada columna. */
export const SQUID_DIRECTIVE_BY_COLUMN: Record<SquidLogColumn, string> = {
  timestamp: "%ts.%03tu",
  elapsed: "%6tr",
  clientIp: "%>a",
  status: "%Ss/%03>Hs",
  bytes: "%<st",
  method: "%rm",
  url: "%ru",
  username: "%[un",
  hierarchy: "%Sh/%<a",
  contentType: "%mt",
};

/**
 * Logformat `squid` estándar, que es el que trae el usuario del AD en la
 * posición 8. Es el default; se confirma contra un archivo real en el Gate 0.
 */
export const STANDARD_SQUID_LOG_COLUMNS: readonly SquidLogColumn[] = [
  "timestamp",
  "elapsed",
  "clientIp",
  "status",
  "bytes",
  "method",
  "url",
  "username",
  "hierarchy",
  "contentType",
];

const TIMESTAMP_FLOOR_MS = Date.UTC(2000, 0, 1);
const TIMESTAMP_CEILING_MS = Date.UTC(2100, 0, 1);

const INTEGER_PATTERN = /^\d+$/;

function parseTimestamp(field: string): number | null {
  const seconds = Number(field);
  if (!Number.isFinite(seconds)) return null;

  const timestampMs = Math.round(seconds * 1000);
  if (timestampMs < TIMESTAMP_FLOOR_MS || timestampMs >= TIMESTAMP_CEILING_MS) {
    return null;
  }

  return timestampMs;
}

function parseNonNegativeInteger(field: string): number | null {
  if (!INTEGER_PATTERN.test(field)) return null;
  return Number(field);
}

function parseStatus(field: string): {
  squidStatus: string;
  httpStatus: number | null;
} {
  const separator = field.indexOf("/");
  if (separator === -1) return { squidStatus: field, httpStatus: null };

  const squidStatus = field.slice(0, separator);
  const httpField = field.slice(separator + 1);
  const httpStatus = INTEGER_PATTERN.test(httpField) ? Number(httpField) : null;

  return { squidStatus, httpStatus };
}

/**
 * Crea el parser para un arreglo de columnas dado.
 *
 * @throws si el arreglo no declara la columna `timestamp`, que es la única
 * obligatoria para poder ubicar el registro en el tiempo.
 */
export function createSquidLogParser(
  columns: readonly SquidLogColumn[] = STANDARD_SQUID_LOG_COLUMNS,
): (line: string) => SquidLogRecord | null {
  if (!columns.includes("timestamp")) {
    throw new Error("El logformat debe declarar la columna 'timestamp'.");
  }

  return (line: string): SquidLogRecord | null => {
    const trimmed = line.trim();
    if (trimmed.length === 0) return null;

    const fields = trimmed.split(/\s+/);
    // Un desajuste de cantidad es señal de logformat distinto al declarado.
    if (fields.length !== columns.length) return null;

    const record: SquidLogRecord = {
      timestampMs: 0,
      elapsedMs: 0,
      clientIp: "",
      squidStatus: "",
      httpStatus: null,
      bytes: 0,
      method: "",
      url: "",
      username: null,
      hierarchy: "",
      contentType: "",
    };

    for (let index = 0; index < columns.length; index += 1) {
      const field = fields[index];

      switch (columns[index]) {
        case "timestamp": {
          const timestampMs = parseTimestamp(field);
          if (timestampMs === null) return null;
          record.timestampMs = timestampMs;
          break;
        }
        case "elapsed": {
          const elapsedMs = parseNonNegativeInteger(field);
          if (elapsedMs === null) return null;
          record.elapsedMs = elapsedMs;
          break;
        }
        case "clientIp": {
          if (field.length === 0) return null;
          record.clientIp = field;
          break;
        }
        case "status": {
          const { squidStatus, httpStatus } = parseStatus(field);
          if (squidStatus.length === 0) return null;
          record.squidStatus = squidStatus;
          record.httpStatus = httpStatus;
          break;
        }
        case "bytes": {
          if (field === "-") {
            record.bytes = 0;
            break;
          }
          const bytes = parseNonNegativeInteger(field);
          if (bytes === null) return null;
          record.bytes = bytes;
          break;
        }
        case "method": {
          if (field.length === 0) return null;
          record.method = field;
          break;
        }
        case "url": {
          if (field.length === 0) return null;
          record.url = field;
          break;
        }
        case "username": {
          record.username = field === "-" ? null : field;
          break;
        }
        case "hierarchy": {
          const separator = field.indexOf("/");
          record.hierarchy = separator === -1 ? field : field.slice(0, separator);
          break;
        }
        case "contentType": {
          record.contentType = field === "-" ? "" : field;
          break;
        }
        default: {
          return null;
        }
      }
    }

    return record;
  };
}

/** Interpreta una línea suelta con el logformat estándar. */
export function parseSquidLogLine(line: string): SquidLogRecord | null {
  return createSquidLogParser()(line);
}

export type StreamParseOptions = {
  columns?: readonly SquidLogColumn[];
  /** Se invoca por cada registro válido; las líneas inválidas solo se cuentan. */
  onRecord: (record: SquidLogRecord) => void;
  /** Contadores opcionales, por si el llamador ya los lleva. */
  stats?: ParseStats;
};

/**
 * Recorre un stream de log línea por línea sin cargarlo en memoria.
 *
 * Un día de tráfico ronda los 4 millones de líneas, así que el archivo nunca se
 * materializa entero: se procesa a medida que llega.
 */
export function parseSquidLogStream(
  input: NodeJS.ReadableStream,
  options: StreamParseOptions,
): Promise<ParseStats> {
  const parse = createSquidLogParser(options.columns);
  const stats: ParseStats = options.stats ?? {
    linesTotal: 0,
    linesInvalid: 0,
  };

  return new Promise<ParseStats>((resolve, reject) => {
    const lines = createInterface({ input, crlfDelay: Infinity });

    lines.on("line", (line) => {
      // Una línea en blanco no es un registro: no ensucia la calidad del dato.
      if (line.trim().length === 0) return;

      stats.linesTotal += 1;

      try {
        const record = parse(line);
        if (record === null) {
          stats.linesInvalid += 1;
          return;
        }
        options.onRecord(record);
      } catch (error) {
        lines.close();
        reject(error);
      }
    });

    lines.on("close", () => resolve(stats));
    lines.on("error", reject);
  });
}
