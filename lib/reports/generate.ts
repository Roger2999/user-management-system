import { createHash } from "node:crypto";
import prisma from "@/lib/prisma";
import { loadDailyMetrics } from "./persistence/load";
import { saveMonthlyReport } from "./persistence/report";
import { buildMonthlyDocument } from "./report";
import { readTemplate, TEMPLATE_VERSION, writeReportDocument } from "./storage";
import { monthlyPeriod } from "./time";

/**
 * Generación del informe mensual desde lo persistido.
 *
 * No vuelve a leer los logs: reconstruye los días desde la base, arma el modelo
 * y el `.docx`, guarda el documento y persiste el informe con sus hallazgos.
 * El archivo se escribe antes de la fila: si la base falla, el `.docx` queda
 * huérfano pero se sobrescribe en la próxima generación; si se escribiera
 * después, la fila podría apuntar a un archivo inexistente.
 */

export class ReportGenerationError extends Error {}

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

  const template = await readTemplate();
  const generatedAt = Date.now();

  const { report, document } = buildMonthlyDocument({
    template,
    days,
    period: { year, month },
    generatedAt,
  });

  const docxSha256 = createHash("sha256").update(document).digest("hex");

  await writeReportDocument(year, month, document);

  return saveMonthlyReport(prisma, {
    report,
    days,
    templateVersion: TEMPLATE_VERSION,
    docxSha256,
    issuedOn: new Date(generatedAt),
  });
}
