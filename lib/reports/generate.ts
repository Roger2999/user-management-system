import { createHash } from "node:crypto";
import prisma from "@/lib/prisma";
import type { UserProfile, UserProfiles } from "./assembly/section-traces";
import { buildDeclarationText } from "./document/declarations";
import { buildIncidents } from "./findings/incidents";
import { buildMonthlyReport } from "./model/monthly";
import { loadDailyMetrics } from "./persistence/load";
import {
  loadReportIncidents,
  saveMonthlyReport,
  updateReportDocument,
} from "./persistence/report";
import { buildReportDocument } from "./report";
import { readTemplate, TEMPLATE_VERSION, writeReportDocument } from "./storage";
import { monthlyPeriod } from "./time";

/**
 * Generación del informe mensual desde lo persistido.
 *
 * No vuelve a leer los logs: reconstruye los días desde la base, persiste los
 * hallazgos, los relee con la disposición y la medida que revisó una persona y
 * recién entonces arma el `.docx`.
 *
 * El orden importa: el documento incluye las medidas, y las medidas viven en la
 * base. Por eso primero se persiste y se relee, después se escribe el archivo y
 * al final se guarda su hash. Si el proceso se cae entre medio, la próxima
 * generación reescribe todo.
 */

export class ReportGenerationError extends Error {}

/**
 * Nombre y cargo de cada cuenta del período.
 *
 * `AccountRequest` es la fuente primaria; `ProxyAccount` solo completa lo que la
 * solicitud no tenga. Las claves van en minúsculas porque el log y la solicitud
 * pueden diferir en mayúsculas y el `username` de la base es `citext`.
 */
async function loadProfiles(
  usernames: readonly string[],
): Promise<UserProfiles> {
  const unique = [...new Set(usernames.map((username) => username.toLowerCase()))];
  if (unique.length === 0) return {};

  const [accounts, proxies] = await Promise.all([
    prisma.accountRequest.findMany({
      where: { username: { in: unique } },
      select: { username: true, fullName: true, currentPosition: true },
    }),
    prisma.proxyAccount.findMany({
      where: { username: { in: unique } },
      select: { username: true, displayName: true, position: true },
    }),
  ]);

  const profiles: Record<string, UserProfile> = {};

  for (const proxy of proxies) {
    profiles[proxy.username.toLowerCase()] = {
      fullName: proxy.displayName ?? "",
      position: proxy.position ?? "",
    };
  }

  for (const account of accounts) {
    if (account.username === null) continue;

    const key = account.username.toLowerCase();
    const previous = profiles[key];
    const fullName = account.fullName.trim();
    const position = account.currentPosition.trim();

    profiles[key] = {
      fullName: fullName.length > 0 ? fullName : (previous?.fullName ?? ""),
      position: position.length > 0 ? position : (previous?.position ?? ""),
    };
  }

  return profiles;
}

export type GeneratedReport = {
  id: string;
  findings: number;
};

export async function generateMonthlyReport(
  year: number,
  month: number,
): Promise<GeneratedReport> {
  const period = monthlyPeriod(year, month);
  const days = await loadDailyMetrics(prisma, period);

  if (days.length === 0) {
    throw new ReportGenerationError(
      `No hay días importados para ${String(month).padStart(2, "0")}/${year}.`,
    );
  }

  const usernames = days.flatMap((day) =>
    day.users
      .map((user) => user.username)
      .filter((username): username is string => username !== null),
  );

  const [template, profiles] = await Promise.all([
    readTemplate(),
    loadProfiles(usernames),
  ]);
  const generatedAt = Date.now();

  const report = buildMonthlyReport({
    year,
    month,
    daily: days,
    profiles,
  });

  // Persistir primero es lo que permite que la tabla 4 salga con las medidas
  // que la persona ya revisó en la UI.
  const saved = await saveMonthlyReport(prisma, {
    report,
    days,
    templateVersion: TEMPLATE_VERSION,
    issuedOn: new Date(generatedAt),
  });

  const sources = await loadReportIncidents(prisma, saved.id);
  const incidents = buildIncidents(sources, profiles);
  const incidentCategories = new Set(
    incidents.map((incident) => incident.category),
  );

  const document = buildReportDocument({
    template,
    traces: report.traces,
    incidents,
    incidentCategories,
    period: { year, month },
    generatedAt,
    declaration: buildDeclarationText(report),
  });

  const docxSha256 = createHash("sha256").update(document).digest("hex");

  await writeReportDocument(year, month, document);
  await updateReportDocument(prisma, { id: saved.id, docxSha256 });

  return { id: saved.id, findings: saved.findings };
}
