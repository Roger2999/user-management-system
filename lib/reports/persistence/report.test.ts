import { rm } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { PrismaClient } from "@/generated/prisma/client";
import type { DailyMetrics } from "../metrics/aggregate";
import { buildMonthlyReport } from "../model/monthly";
import { monthlyPeriod } from "../time";
import { importSquidLogFile } from "./import";
import { saveMonthlyReport } from "./report";
import { readReportDocument, reportsDir } from "../storage";

/**
 * Prueba de la persistencia del informe y sus hallazgos contra la base real.
 *
 * No corre por defecto (`REPORTS_DB_TEST=1`). Usa el año 2099 y un patrón de
 * regla propio para no tocar datos reales, y limpia todo lo que crea.
 */

const enabled = process.env.REPORTS_DB_TEST === "1";
const YEAR = 2099;
const MONTH = 2;
const PERIOD = monthlyPeriod(YEAR, MONTH);
const USER = "__reports_report_test_user__";
const PATTERN = "__reports-test.example";

function day(
  name: string,
  pairs: { site: string; username: string | null; hits: number }[],
): DailyMetrics {
  return {
    day: name,
    totalHits: pairs.reduce((sum, pair) => sum + pair.hits, 0),
    totalBytesIn: 0,
    totalBytesOut: 0,
    totalElapsedMs: 0,
    unidentifiedHits: 0,
    skipped: { unserved: 0, internal: 0, telemetry: 0 },
    users: [],
    sites: [],
    siteUsers: pairs.map((pair) => ({
      site: pair.site,
      username: pair.username,
      hits: pair.hits,
      bytesIn: 0,
      elapsedMs: 0,
      browsingMs: 0,
    })),
  };
}

const SITE = `www.${PATTERN}`;

const GENERATE_MONTH = 3;
const GENERATE_PERIOD = monthlyPeriod(YEAR, GENERATE_MONTH);
const GENERATE_USER = "__reports_generate_test_user__";
const GENERATE_FILE = "__reports_generate_test__";

const GENERATE_DATES = GENERATE_PERIOD.days.map(
  (day) => new Date(`${day}T00:00:00.000Z`),
);

const DAYS = [
  day("2099-02-01", [{ site: SITE, username: USER, hits: 2 }]),
  day("2099-02-02", [{ site: SITE, username: USER, hits: 3 }]),
];

describe.skipIf(!enabled)("persistencia del informe mensual", () => {
  let prisma: PrismaClient | undefined;
  let ruleId = "";

  function db(): PrismaClient {
    if (prisma === undefined) throw new Error("base de datos no inicializada");
    return prisma;
  }

  async function cleanup(): Promise<void> {
    const months = [MONTH, GENERATE_MONTH];
    await db().reportFinding.deleteMany({
      where: { monthlyReport: { year: YEAR, month: { in: months } } },
    });
    await db().monthlyReport.deleteMany({
      where: { year: YEAR, month: { in: months } },
    });
    await db().dailySkipped.deleteMany({
      where: { date: { in: GENERATE_DATES } },
    });
    await db().dailySiteUserStat.deleteMany({
      where: { date: { in: GENERATE_DATES } },
    });
    await db().dailyUserStat.deleteMany({
      where: { date: { in: GENERATE_DATES } },
    });
    await db().dailySiteStat.deleteMany({
      where: { date: { in: GENERATE_DATES } },
    });
    await db().importedLogFile.deleteMany({
      where: { fileName: { startsWith: GENERATE_FILE } },
    });
    await db().categoryRule.deleteMany({ where: { pattern: PATTERN } });
    await db().proxyAccount.deleteMany({
      where: { username: { in: [USER, GENERATE_USER] } },
    });
    await rm(
      path.join(
        reportsDir(),
        `${YEAR}-${String(GENERATE_MONTH).padStart(2, "0")}.docx`,
      ),
      { force: true },
    );
  }

  beforeAll(async () => {
    if (!process.env.DATABASE_URL) process.loadEnvFile(".env");

    prisma = (await import("@/lib/prisma")).default;
    await cleanup();

    await db().proxyAccount.create({ data: { username: USER } });
    const rule = await db().categoryRule.create({
      data: { category: "ADULT", matchType: "SUFFIX", pattern: PATTERN },
    });
    ruleId = rule.id;
  }, 60_000);

  afterAll(async () => {
    if (prisma === undefined) return;
    await cleanup();

    const reports = await db().monthlyReport.count({
      where: { year: YEAR, month: { in: [MONTH, GENERATE_MONTH] } },
    });
    const rules = await db().categoryRule.count({ where: { pattern: PATTERN } });
    const accounts = await db().proxyAccount.count({ where: { username: USER } });
    await prisma.$disconnect();

    expect(reports).toBe(0);
    expect(rules).toBe(0);
    expect(accounts).toBe(0);
  }, 60_000);

  it("guarda el informe y detecta los hallazgos del período", async () => {
    const report = buildMonthlyReport({ year: YEAR, month: MONTH, daily: DAYS });

    const saved = await saveMonthlyReport(db(), {
      report,
      days: DAYS,
      templateVersion: 1,
      docxSha256: "a".repeat(64),
      issuedOn: new Date("2099-03-01T12:00:00.000Z"),
    });

    expect(saved.findings).toBe(1);

    const row = await db().monthlyReport.findUnique({
      where: { year_month: { year: YEAR, month: MONTH } },
    });

    expect(row).toMatchObject({
      coverageDaysExpected: PERIOD.days.length,
      coverageDaysImported: 2,
      totalHits: BigInt(5),
      docxSha256: "a".repeat(64),
    });

    const findings = await db().reportFinding.findMany({
      where: { monthlyReportId: saved.id },
    });

    expect(findings).toHaveLength(1);
    expect(findings[0]).toMatchObject({
      categoryRuleId: ruleId,
      proxyAccountId: USER,
      url: SITE,
      hits: 5,
      disposition: "PENDING",
    });
    expect(findings[0].firstSeen).toEqual(
      new Date("2099-02-01T12:00:00.000Z"),
    );
    expect(findings[0].lastSeen).toEqual(
      new Date("2099-02-02T12:00:00.000Z"),
    );
  }, 60_000);

  it("regenerar conserva la revisión y actualiza la evidencia", async () => {
    const before = await db().reportFinding.findFirst({
      where: { monthlyReport: { year: YEAR, month: MONTH } },
    });
    if (before === null) throw new Error("falta el hallazgo de la prueba anterior");

    await db().reportFinding.update({
      where: { id: before.id },
      data: { disposition: "CONFIRMED", measure: "bloqueado en el proxy" },
    });

    const days = [
      day("2099-02-01", [{ site: SITE, username: USER, hits: 4 }]),
      day("2099-02-02", [{ site: SITE, username: USER, hits: 6 }]),
    ];
    const report = buildMonthlyReport({ year: YEAR, month: MONTH, daily: days });

    const saved = await saveMonthlyReport(db(), {
      report,
      days,
      templateVersion: 1,
      docxSha256: "b".repeat(64),
      issuedOn: new Date("2099-03-02T12:00:00.000Z"),
    });

    const after = await db().reportFinding.findUnique({
      where: { id: before.id },
    });

    expect(saved.findings).toBe(1);
    expect(after).toMatchObject({
      hits: 10,
      disposition: "CONFIRMED",
      measure: "bloqueado en el proxy",
    });
  }, 60_000);

  it("genera el .docx desde la base y lo deja descargable", async () => {
    const timestamp = Math.floor(Date.UTC(2099, 2, 1, 16, 0, 0) / 1000);
    const log = `${timestamp}.000    100 10.0.0.1 TCP_MISS/200 500 GET http://${SITE}/ ${GENERATE_USER} HIER_DIRECT/1.2.3.4 text/html\n`;

    const imported = await importSquidLogFile(db(), {
      fileName: `${GENERATE_FILE}.log`,
      stream: Readable.from([log]),
      period: GENERATE_PERIOD,
    });
    expect(imported.status).toBe("imported");

    // El servicio usa el cliente singleton: se importa después de cargar `.env`.
    const { generateMonthlyReport } = await import("../generate");
    const saved = await generateMonthlyReport(YEAR, GENERATE_MONTH);

    const row = await db().monthlyReport.findUnique({
      where: { year_month: { year: YEAR, month: GENERATE_MONTH } },
    });

    expect(row?.docxSha256).not.toBeNull();
    expect(saved.id).toBe(row?.id);
    expect(saved.findings).toBe(1);

    const bytes = await readReportDocument(YEAR, GENERATE_MONTH);
    expect(Buffer.from(bytes.subarray(0, 2)).toString("latin1")).toBe("PK");
  }, 60_000);

  it("borra el hallazgo cuando la regla deja de estar activa", async () => {
    await db().categoryRule.update({
      where: { id: ruleId },
      data: { active: false },
    });

    const report = buildMonthlyReport({ year: YEAR, month: MONTH, daily: DAYS });
    const saved = await saveMonthlyReport(db(), {
      report,
      days: DAYS,
      templateVersion: 1,
      docxSha256: "c".repeat(64),
      issuedOn: new Date("2099-03-03T12:00:00.000Z"),
    });

    const findings = await db().reportFinding.count({
      where: { monthlyReportId: saved.id },
    });

    expect(saved.findings).toBe(0);
    expect(findings).toBe(0);
  }, 60_000);
});
