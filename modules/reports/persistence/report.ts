import { Prisma, type PrismaClient } from "@/lib/db";
import { detectFindings } from "../findings/detect";
import {
  isIncidentCategory,
  type IncidentSource,
} from "../findings/incidents";
import type { DailyMetrics } from "../metrics/aggregate";
import type { MonthlyReport } from "../model/monthly";

/**
 * Persistencia del informe mensual y de sus hallazgos (S5, S13).
 *
 * El informe se identifica por (año, mes): regenerarlo actualiza la misma fila
 * en lugar de acumular versiones. El `snapshot` guarda lo que se aprobó —los
 * totales, la cobertura, las declaraciones y las tablas de la sección 1—, no la
 * lista completa de sitios y pares, que ya vive en las tablas diarias.
 *
 * **Los hallazgos conservan su revisión.** Regenerar el informe vuelve a
 * detectar coincidencias, pero una coincidencia que ya existía conserva su
 * disposición y su medida; solo se actualizan los hits, el browsing time y las
 * fechas. Una
 * coincidencia que desapareció se borra. Así una corrección del período no
 * obliga a revisar de nuevo lo ya revisado.
 */

export type SaveMonthlyReportInput = {
  report: MonthlyReport;
  /** Días del período, para la evidencia de los hallazgos. */
  days: readonly DailyMetrics[];
  templateVersion: number;
  /**
   * Hash del `.docx`. Se omite al persistir los hallazgos antes de armar el
   * documento; se completa después con `updateReportDocument`.
   */
  docxSha256?: string;
  issuedOn: Date;
};

export type SavedMonthlyReport = {
  id: string;
  findings: number;
};

type FindingRow = {
  categoryRuleId: string;
  url: string;
  proxyAccountId: string | null;
};

function findingKey(row: FindingRow): string {
  return `${row.categoryRuleId}\u0001${row.url}\u0001${row.proxyAccountId ?? ""}`;
}

function snapshotOf(report: MonthlyReport): Prisma.InputJsonValue {
  return {
    period: report.period,
    coverage: report.coverage,
    declarations: report.declarations,
    totals: {
      totalHits: report.totals.totalHits,
      totalBytesIn: report.totals.totalBytesIn,
      totalBytesOut: report.totals.totalBytesOut,
      totalElapsedMs: report.totals.totalElapsedMs,
      unidentifiedHits: report.totals.unidentifiedHits,
      skipped: report.totals.skipped,
    },
    traces: report.traces,
  } as unknown as Prisma.InputJsonValue;
}

export async function saveMonthlyReport(
  prisma: PrismaClient,
  input: SaveMonthlyReportInput,
): Promise<SavedMonthlyReport> {
  const { year, month } = input.report.period;

  return prisma.$transaction(async (tx) => {
    const rules = await tx.categoryRule.findMany({ where: { active: true } });
    const rulesetVersion = rules.reduce(
      (highest, rule) => Math.max(highest, rule.version),
      0,
    );

    const shared = {
      rulesetVersion,
      coverageDaysExpected: input.report.coverage.expectedDays,
      coverageDaysImported: input.report.coverage.presentDays,
      totalHits: BigInt(input.report.totals.totalHits),
      unidentifiedHits: BigInt(input.report.totals.unidentifiedHits),
      templateVersion: input.templateVersion,
      issuedOn: input.issuedOn,
      docxSha256: input.docxSha256,
      snapshot: snapshotOf(input.report),
    };

    const row = await tx.monthlyReport.upsert({
      where: { year_month: { year, month } },
      create: { year, month, ...shared },
      update: shared,
    });

    const detected = detectFindings(input.days, rules);

    // Una cuenta que ya no existe se guarda como tráfico sin identificar: la
    // evidencia no se pierde, y la clave foránea no rompe la transacción.
    const usernames = [
      ...new Set(
        detected
          .map((candidate) => candidate.username)
          .filter((username): username is string => username !== null),
      ),
    ];
    const knownAccounts =
      usernames.length === 0
        ? []
        : await tx.proxyAccount.findMany({
            where: { username: { in: usernames } },
            select: { username: true },
          });
    const known = new Set(knownAccounts.map((account) => account.username));

    const candidates = detected.map((candidate) => ({
      ...candidate,
      proxyAccountId:
        candidate.username !== null && known.has(candidate.username)
          ? candidate.username
          : null,
    }));

    const existing = await tx.reportFinding.findMany({
      where: { monthlyReportId: row.id },
      select: {
        id: true,
        categoryRuleId: true,
        url: true,
        proxyAccountId: true,
      },
    });
    const existingByKey = new Map(
      existing.map((finding) => [findingKey(finding), finding]),
    );

    const detectedKeys = new Set<string>();

    for (const candidate of candidates) {
      const key = findingKey({
        categoryRuleId: candidate.categoryRuleId,
        url: candidate.site,
        proxyAccountId: candidate.proxyAccountId,
      });
      detectedKeys.add(key);

      const current = existingByKey.get(key);
      const evidence = {
        hits: candidate.hits,
        browsingMs: candidate.browsingMs,
        firstSeen: candidate.firstSeen,
        lastSeen: candidate.lastSeen,
      };

      if (current === undefined) {
        await tx.reportFinding.create({
          data: {
            monthlyReportId: row.id,
            categoryRuleId: candidate.categoryRuleId,
            proxyAccountId: candidate.proxyAccountId,
            url: candidate.site,
            ...evidence,
          },
        });
      } else {
        await tx.reportFinding.update({
          where: { id: current.id },
          data: evidence,
        });
      }
    }

    const stale = existing
      .filter((finding) => !detectedKeys.has(findingKey(finding)))
      .map((finding) => finding.id);

    if (stale.length > 0) {
      await tx.reportFinding.deleteMany({ where: { id: { in: stale } } });
    }

    return { id: row.id, findings: candidates.length };
  });
}

/**
 * Completa el hash del documento después de escribirlo.
 *
 * La generación persiste primero los hallazgos para poder releerlos con su
 * medida; el `.docx` se arma después y el hash se guarda al final. Una fila
 * sin hash es un informe cuyos hallazgos existen pero cuyo archivo todavía no
 * se emitió.
 */
export async function updateReportDocument(
  prisma: PrismaClient,
  input: { id: string; docxSha256: string },
): Promise<void> {
  await prisma.monthlyReport.update({
    where: { id: input.id },
    data: { docxSha256: input.docxSha256 },
  });
}

/**
 * Hallazgos del informe con su revisión, listos para la tabla 4.
 *
 * Se leen después de persistir: la medida y la disposición las puso una persona
 * en la UI y son las que tienen que salir en el documento. El nombre y el cargo
 * se resuelven con los perfiles que ya cargó la generación; `ProxyAccount` es
 * solo el respaldo.
 */
export async function loadReportIncidents(
  prisma: PrismaClient,
  monthlyReportId: string,
): Promise<IncidentSource[]> {
  const findings = await prisma.reportFinding.findMany({
    where: { monthlyReportId },
    select: {
      url: true,
      disposition: true,
      measure: true,
      proxyAccountId: true,
      categoryRule: { select: { category: true } },
      proxyAccount: { select: { displayName: true, position: true } },
    },
    orderBy: { url: "asc" },
  });

  const incidents: IncidentSource[] = [];

  for (const finding of findings) {
    if (!isIncidentCategory(finding.categoryRule.category)) continue;

    incidents.push({
      url: finding.url,
      category: finding.categoryRule.category,
      username: finding.proxyAccountId,
      disposition: finding.disposition,
      measure: finding.measure,
      proxyFullName: finding.proxyAccount?.displayName ?? undefined,
      proxyPosition: finding.proxyAccount?.position ?? undefined,
    });
  }

  return incidents;
}
