import { createHash } from "node:crypto";
import { Transform } from "node:stream";
import { Prisma, type PrismaClient } from "@/generated/prisma/client";
import {
  ingestSquidLog,
  type IngestSquidLogOptions,
  type OutsidePeriodDay,
} from "../ingest";
import type { MonthlyPeriod } from "../time";
import type { ParseStats } from "../types";
import {
  collectUsernames,
  toDailyStatRows,
  type DailySiteStatRow,
  type DailySiteUserStatRow,
  type DailyStatRows,
  type DailyUserStatRow,
} from "./rows";

/**
 * Ingesta de un archivo diario de Squid a la base de datos.
 *
 * Tres cosas que no son obvias:
 *
 * - **El hash se calcula sobre los bytes crudos**, no sobre las métricas. Se
 *   engancha un `Transform` entre el archivo y el parser: el mismo recorrido
 *   alimenta el SHA-256 y la agregación, sin leer el archivo dos veces.
 * - **Reimportar el mismo archivo no duplica.** `ImportedLogFile.sha256` es
 *   único y se consulta antes de parsear. Dos importaciones simultáneas del
 *   mismo archivo chocan contra el unique; la transacción se revierte entera y
 *   se responde con el archivo que ganó.
 * - **Los agregados son aditivos, no reemplazos.** Un día local puede estar
 *   repartido entre dos archivos (el archivo de un día UTC contiene registros de
 *   dos días locales en `America/Havana`). Sumar las contribuciones es lo
 *   correcto; reemplazar el día perdería la parte que trajo el otro archivo.
 *   El costo es conocido y declarado: el reloj de `Browsing Time` se corta en el
 *   borde entre archivos, igual que se corta en la medianoche local (S12).
 *
 * Los pares (sitio, usuario) se guardan completos (S17). El recorte a diez filas
 * es del render, nunca del almacenamiento.
 */

export type ImportSquidLogInput = {
  fileName: string;
  stream: NodeJS.ReadableStream;
  /** Período del informe: define qué días locales se persisten. */
  period: Pick<MonthlyPeriod, "days">;
  importedById?: string | null;
  timeZone?: string;
  columns?: IngestSquidLogOptions["columns"];
  metrics?: IngestSquidLogOptions["metrics"];
};

export type ImportedLogFileSummary = {
  id: string;
  sha256: string;
  fileName: string;
  sizeBytes: number;
  linesTotal: number;
  linesInvalid: number;
  firstEventAt: number;
  lastEventAt: number;
};

export type ImportSquidLogResult =
  | { status: "already-imported"; file: ImportedLogFileSummary }
  | {
      status: "imported";
      file: ImportedLogFileSummary;
      /** Días locales del período que aportó el archivo. */
      days: string[];
      stats: ParseStats;
      outsidePeriod: OutsidePeriodDay[];
    };

/** Tamaño de cada sentencia de escritura: 500 filas × 7 columnas. */
const WRITE_CHUNK = 500;

type Tee = {
  stream: NodeJS.ReadableStream;
  digest: () => string;
  size: () => number;
};

/**
 * Pasa los bytes sin tocarlos y calcula su SHA-256 y su tamaño.
 *
 * `digest()` solo es válido cuando el consumidor terminó de leer: el parser
 * resuelve cuando el stream se cierra, que es cuando el hash ya vio todo.
 */
function teeSha256(source: NodeJS.ReadableStream): Tee {
  const hash = createHash("sha256");
  let size = 0;

  const tap = new Transform({
    transform(chunk: Buffer, _encoding, callback) {
      hash.update(chunk);
      size += chunk.length;
      callback(null, chunk);
    },
  });

  source.on("error", (error) => tap.destroy(error));
  source.pipe(tap);

  return { stream: tap, digest: () => hash.digest("hex"), size: () => size };
}

function summarize(file: {
  id: string;
  sha256: string;
  fileName: string;
  sizeBytes: bigint;
  linesTotal: number;
  linesInvalid: number;
  firstEventAt: Date;
  lastEventAt: Date;
}): ImportedLogFileSummary {
  return {
    id: file.id,
    sha256: file.sha256,
    fileName: file.fileName,
    sizeBytes: Number(file.sizeBytes),
    linesTotal: file.linesTotal,
    linesInvalid: file.linesInvalid,
    firstEventAt: file.firstEventAt.getTime(),
    lastEventAt: file.lastEventAt.getTime(),
  };
}

/** Importa un `access.log` diario. Idempotente por SHA-256. */
export async function importSquidLogFile(
  prisma: PrismaClient,
  input: ImportSquidLogInput,
): Promise<ImportSquidLogResult> {
  const tee = teeSha256(input.stream);
  const ingestion = await ingestSquidLog(tee.stream, {
    period: input.period,
    timeZone: input.timeZone,
    columns: input.columns,
    metrics: input.metrics,
  });
  const sha256 = tee.digest();

  const already = await prisma.importedLogFile.findUnique({ where: { sha256 } });
  if (already !== null) {
    return { status: "already-imported", file: summarize(already) };
  }

  if (ingestion.firstEventAt === null || ingestion.lastEventAt === null) {
    throw new RangeError(
      `el archivo ${input.fileName} no tiene registros válidos`,
    );
  }

  const rows = toDailyStatRows(ingestion.days);
  const usernames = collectUsernames(ingestion.days);

  const data = {
    sha256,
    fileName: input.fileName,
    sizeBytes: BigInt(tee.size()),
    linesTotal: ingestion.stats.linesTotal,
    linesInvalid: ingestion.stats.linesInvalid,
    firstEventAt: new Date(ingestion.firstEventAt),
    lastEventAt: new Date(ingestion.lastEventAt),
    importedById: input.importedById ?? null,
  };

  try {
    await prisma.$transaction(
      async (tx) => {
        await tx.importedLogFile.create({ data });

        if (usernames.length > 0) {
          await tx.proxyAccount.createMany({
            data: usernames.map((username) => ({ username })),
            skipDuplicates: true,
          });
        }

        await writeDailyStats(tx, rows);
      },
      // Un mes completo son cientos de miles de filas; el default de 5 s no
      // alcanza ni para el archivo más grande.
      { timeout: 180_000, maxWait: 15_000 },
    );
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      const raced = await prisma.importedLogFile.findUnique({ where: { sha256 } });
      if (raced !== null) {
        return { status: "already-imported", file: summarize(raced) };
      }
    }

    throw error;
  }

  const stored = await prisma.importedLogFile.findUniqueOrThrow({
    where: { sha256 },
  });

  return {
    status: "imported",
    file: summarize(stored),
    days: ingestion.days.map((day) => day.day),
    stats: ingestion.stats,
    outsidePeriod: ingestion.outsidePeriod,
  };
}

async function writeDailyStats(
  tx: Prisma.TransactionClient,
  rows: DailyStatRows,
): Promise<void> {
  await writeSites(tx, rows.sites);
  await writeUsers(tx, rows.users);
  await writeSiteUsers(tx, rows.siteUsers);
}

function chunksOf<T>(rows: readonly T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let index = 0; index < rows.length; index += size) {
    chunks.push(rows.slice(index, index + size));
  }
  return chunks;
}

async function writeSites(
  tx: Prisma.TransactionClient,
  rows: readonly DailySiteStatRow[],
): Promise<void> {
  for (const chunk of chunksOf(rows, WRITE_CHUNK)) {
    await tx.$executeRaw`
      INSERT INTO daily_site_stat (date, site, hits, "bytesIn", "bytesOut", "elapsedMs", "browsingMs")
      VALUES ${Prisma.join(
        chunk.map(
          (row) =>
            Prisma.sql`(${row.day}::date, ${row.site}, ${row.hits}, ${BigInt(row.bytesIn)}, ${BigInt(row.bytesOut)}, ${BigInt(row.elapsedMs)}, ${BigInt(row.browsingMs)})`,
        ),
      )}
      ON CONFLICT (date, site) DO UPDATE SET
        hits = daily_site_stat.hits + EXCLUDED.hits,
        "bytesIn" = daily_site_stat."bytesIn" + EXCLUDED."bytesIn",
        "bytesOut" = daily_site_stat."bytesOut" + EXCLUDED."bytesOut",
        "elapsedMs" = daily_site_stat."elapsedMs" + EXCLUDED."elapsedMs",
        "browsingMs" = daily_site_stat."browsingMs" + EXCLUDED."browsingMs"
    `;
  }
}

async function writeUsers(
  tx: Prisma.TransactionClient,
  rows: readonly DailyUserStatRow[],
): Promise<void> {
  for (const chunk of chunksOf(rows, WRITE_CHUNK)) {
    await tx.$executeRaw`
      INSERT INTO daily_user_stat (date, "proxyAccountId", hits, "bytesIn", "bytesOut", "elapsedMs", "browsingMs")
      VALUES ${Prisma.join(
        chunk.map(
          (row) =>
            Prisma.sql`(${row.day}::date, ${row.username}, ${row.hits}, ${BigInt(row.bytesIn)}, ${BigInt(row.bytesOut)}, ${BigInt(row.elapsedMs)}, ${BigInt(row.browsingMs)})`,
        ),
      )}
      ON CONFLICT (date, "proxyAccountId") DO UPDATE SET
        hits = daily_user_stat.hits + EXCLUDED.hits,
        "bytesIn" = daily_user_stat."bytesIn" + EXCLUDED."bytesIn",
        "bytesOut" = daily_user_stat."bytesOut" + EXCLUDED."bytesOut",
        "elapsedMs" = daily_user_stat."elapsedMs" + EXCLUDED."elapsedMs",
        "browsingMs" = daily_user_stat."browsingMs" + EXCLUDED."browsingMs"
    `;
  }
}

async function writeSiteUsers(
  tx: Prisma.TransactionClient,
  rows: readonly DailySiteUserStatRow[],
): Promise<void> {
  for (const chunk of chunksOf(rows, WRITE_CHUNK)) {
    await tx.$executeRaw`
      INSERT INTO daily_site_user_stat (date, site, "proxyAccountId", hits, "bytesIn", "elapsedMs", "browsingMs")
      VALUES ${Prisma.join(
        chunk.map(
          (row) =>
            Prisma.sql`(${row.day}::date, ${row.site}, ${row.username}, ${row.hits}, ${BigInt(row.bytesIn)}, ${BigInt(row.elapsedMs)}, ${BigInt(row.browsingMs)})`,
        ),
      )}
      ON CONFLICT (date, site, "proxyAccountId") DO UPDATE SET
        hits = daily_site_user_stat.hits + EXCLUDED.hits,
        "bytesIn" = daily_site_user_stat."bytesIn" + EXCLUDED."bytesIn",
        "elapsedMs" = daily_site_user_stat."elapsedMs" + EXCLUDED."elapsedMs",
        "browsingMs" = daily_site_user_stat."browsingMs" + EXCLUDED."browsingMs"
    `;
  }
}
