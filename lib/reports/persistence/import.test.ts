import { Readable } from "node:stream";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { PrismaClient } from "@/generated/prisma/client";
import { ingestSquidLog } from "../ingest";
import type { DailyMetrics } from "../metrics/aggregate";
import { monthlyPeriod } from "../time";
import { importSquidLogFile } from "./import";
import { listImportedDays, loadDailyMetrics } from "./load";

/**
 * Prueba de la persistencia contra la base real.
 *
 * No corre por defecto: escribe en `DATABASE_URL`, y una suite que depende de una
 * base remota no puede ser parte del `pnpm test` normal. Se ejecuta con
 * `REPORTS_DB_TEST=1` y limpia todo lo que crea, incluso si falla.
 *
 * Usa el año 2099 para no tocar datos reales del informe. Los días son locales:
 * `16:00Z` en enero es `11:00` en La Habana (UTC-5).
 */

const enabled = process.env.REPORTS_DB_TEST === "1";
const PERIOD = monthlyPeriod(2099, 1);
const USER = "__reports_test_user__";
const FILE_PREFIX = "__reports_test__";

const JAN_1 = Date.UTC(2099, 0, 1, 16, 0, 0);
const JAN_2 = Date.UTC(2099, 0, 2, 16, 0, 0);
const JAN_3 = Date.UTC(2099, 0, 3, 16, 0, 0);
const TEST_DATES = PERIOD.days.map((day) => new Date(`${day}T00:00:00.000Z`));

function line(timestampMs: number, url: string, username: string | null): string {
  const seconds = Math.floor(timestampMs / 1000);
  const millis = String(timestampMs % 1000).padStart(3, "0");
  const account = username ?? "-";

  return `${seconds}.${millis}    100 10.0.0.1 TCP_MISS/200 500 GET ${url} ${account} HIER_DIRECT/1.2.3.4 text/html`;
}

function rejectedLine(
  timestampMs: number,
  url: string,
  username: string | null,
  status: number,
): string {
  const seconds = Math.floor(timestampMs / 1000);
  const millis = String(timestampMs % 1000).padStart(3, "0");
  const account = username ?? "-";

  return `${seconds}.${millis}    100 10.0.0.1 TCP_DENIED/${status} 500 GET ${url} ${account} HIER_DIRECT/1.2.3.4 text/html`;
}

const FIRST_LOG = [
  line(JAN_1, "http://www.example.com/", USER),
  line(JAN_1 + 1000, "http://www.example.com/a", USER),
  line(JAN_1 + 2000, "http://www.example.com/b", USER),
  line(JAN_1 + 3000, "http://cdn.example.com/x", null),
  line(JAN_2, "http://www.example.com/", USER),
  line(JAN_2 + 1000, "http://www.example.com/a", USER),
].join("\n");

/** Segundo archivo: aporta al mismo día local, con otro contenido y otro hash. */
const SECOND_LOG = [
  line(JAN_1 + 10_000, "http://www.example.com/c", USER),
  line(JAN_1 + 11_000, "http://www.example.com/d", USER),
].join("\n");

/** Tercer archivo: un día con un hit real y tres descartes, uno por motivo. */
const SKIPPED_LOG = [
  line(JAN_3, "http://www.example.com/", USER),
  rejectedLine(JAN_3 + 1000, "http://www.example.com/x", USER, 407),
  line(JAN_3 + 2000, "http://10.0.0.5/x", USER),
  line(JAN_3 + 3000, "http://firefox-portal-detection.com/x", USER),
].join("\n");

function streamOf(text: string): Readable {
  return Readable.from([`${text}\n`]);
}

function identified(days: readonly DailyMetrics[]): DailyMetrics[] {
  return days.map((day) => ({
    ...day,
    users: day.users.filter((user) => user.username !== null),
    siteUsers: day.siteUsers.filter((row) => row.username !== null),
  }));
}

describe.skipIf(!enabled)("persistencia del log diario", () => {
  let prisma: PrismaClient | undefined;

  function db(): PrismaClient {
    if (prisma === undefined) throw new Error("base de datos no inicializada");
    return prisma;
  }

  async function cleanup(): Promise<void> {
    await db().dailySkipped.deleteMany({ where: { date: { in: TEST_DATES } } });
    await db().dailySiteUserStat.deleteMany({ where: { date: { in: TEST_DATES } } });
    await db().dailyUserStat.deleteMany({ where: { date: { in: TEST_DATES } } });
    await db().dailySiteStat.deleteMany({ where: { date: { in: TEST_DATES } } });
    await db().importedLogFile.deleteMany({
      where: { fileName: { startsWith: FILE_PREFIX } },
    });
    await db().proxyAccount.deleteMany({ where: { username: USER } });
  }

  beforeAll(async () => {
    if (!process.env.DATABASE_URL) process.loadEnvFile(".env");

    prisma = (await import("@/lib/prisma")).default;
    await cleanup();
  });

  afterAll(async () => {
    if (prisma === undefined) return;
    await cleanup();

    const leftovers = await prisma.dailySiteStat.count({
      where: { date: { in: TEST_DATES } },
    });
    const skippedLeftovers = await prisma.dailySkipped.count({
      where: { date: { in: TEST_DATES } },
    });
    await prisma.$disconnect();

    expect(leftovers).toBe(0);
    expect(skippedLeftovers).toBe(0);
  });

  it("importa un archivo, no lo duplica y lo relee igual", async () => {
    const first = await importSquidLogFile(db(), {
      fileName: `${FILE_PREFIX}a.log`,
      stream: streamOf(FIRST_LOG),
      period: PERIOD,
    });

    expect(first.status).toBe("imported");
    if (first.status !== "imported") return;
    expect(first.days).toEqual(["2099-01-01", "2099-01-02"]);
    expect(first.stats.linesTotal).toBe(6);

    const again = await importSquidLogFile(db(), {
      fileName: `${FILE_PREFIX}a.log`,
      stream: streamOf(FIRST_LOG),
      period: PERIOD,
    });

    expect(again.status).toBe("already-imported");
    expect(again.file.sha256).toBe(first.file.sha256);

    const loaded = await loadDailyMetrics(db(), PERIOD);
    const direct = await ingestSquidLog(streamOf(FIRST_LOG), { period: PERIOD });

    expect(loaded).toEqual(identified(direct.days));
    expect(loaded[0].unidentifiedHits).toBe(1);
    expect(loaded[0].totalHits).toBe(4);
    expect(loaded[1].unidentifiedHits).toBe(0);
  });

  it("suma la contribución de un segundo archivo al mismo día", async () => {
    const second = await importSquidLogFile(db(), {
      fileName: `${FILE_PREFIX}b.log`,
      stream: streamOf(SECOND_LOG),
      period: PERIOD,
    });

    expect(second.status).toBe("imported");

    const loaded = await loadDailyMetrics(db(), PERIOD);
    const january1 = loaded.find((day) => day.day === "2099-01-01");

    // 4 del primer archivo + 2 del segundo: la escritura es aditiva, no un
    // reemplazo que borraría la primera contribución.
    expect(january1?.totalHits).toBe(6);
    expect(january1?.users[0]).toMatchObject({ username: USER, hits: 5 });
  });

  it("persiste los descartes por día y la marca de telemetría sin reimportar", async () => {
    const third = await importSquidLogFile(db(), {
      fileName: `${FILE_PREFIX}c.log`,
      stream: streamOf(SKIPPED_LOG),
      period: PERIOD,
    });

    expect(third.status).toBe("imported");

    const loaded = await loadDailyMetrics(db(), PERIOD);
    const january3 = loaded.find((day) => day.day === "2099-01-03");

    // example.com es un hit; la telemetría también cuenta como hit (S26). Lo que
    // se descarta son la respuesta no servida y el destino interno.
    expect(january3?.totalHits).toBe(2);
    expect(january3?.skipped).toEqual({
      unserved: 1,
      internal: 1,
      telemetry: 1,
    });
    expect(january3?.sites).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          site: "www.example.com",
          hits: 1,
          telemetry: false,
        }),
        expect.objectContaining({
          site: "firefox-portal-detection.com",
          hits: 1,
          telemetry: true,
        }),
      ]),
    );
  });

  it("enumera los días cargados sin cargar el resto del período", async () => {
    // Es la consulta que alimenta la cobertura antes de generar: un día con
    // todos sus descartes en cero igual cuenta como cargado.
    expect(await listImportedDays(db(), PERIOD)).toEqual([
      "2099-01-01",
      "2099-01-02",
      "2099-01-03",
    ]);
  });
});
