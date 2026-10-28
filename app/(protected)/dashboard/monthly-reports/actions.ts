"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/helpers/requireAdmin";
import { optionalTextField, textField } from "@/lib/form-data";
import prisma from "@/lib/prisma";
import {
  generateMonthlyReport,
  ReportGenerationError,
} from "@/lib/reports/generate";
import {
  listImportedDays,
  listPeriodFiles,
} from "@/lib/reports/persistence/load";
import {
  checkCoverage,
  monthlyPeriod,
  type PeriodCoverage,
} from "@/lib/reports/time";
import { FindingDisposition } from "@/generated/prisma/enums";

export type GenerateReportState = { error?: string };

function messageOf(error: unknown): string {
  if (error instanceof ReportGenerationError) return error.message;
  if (
    error instanceof Error &&
    (error as NodeJS.ErrnoException).code === "ENOENT"
  ) {
    return "No se encontró la plantilla oficial. Configura REPORTS_TEMPLATE_PATH.";
  }
  return error instanceof Error
    ? error.message
    : "No se pudo generar el informe.";
}

function periodFrom(
  formData: FormData,
): { year: number; month: number } | null {
  const year = Number(textField(formData, "year"));
  const month = Number(textField(formData, "month"));

  if (
    !Number.isInteger(year) ||
    year < 2000 ||
    year > 2100 ||
    !Number.isInteger(month) ||
    month < 1 ||
    month > 12
  ) {
    return null;
  }

  return { year, month };
}

export async function generateReportAction(
  _previous: GenerateReportState,
  formData: FormData,
): Promise<GenerateReportState> {
  await requireAdmin();

  const period = periodFrom(formData);
  if (period === null) return { error: "Período inválido." };

  let id: string;
  try {
    const saved = await generateMonthlyReport(period.year, period.month);
    id = saved.id;
  } catch (error) {
    return { error: messageOf(error) };
  }

  revalidatePath("/dashboard/monthly-reports", "layout");
  redirect(`/dashboard/monthly-reports/${id}`);
}

export async function regenerateReportAction(
  formData: FormData,
): Promise<void> {
  await requireAdmin();

  const reportId = textField(formData, "reportId");
  const period = periodFrom(formData);

  if (period === null) {
    redirect(
      `/dashboard/monthly-reports/${reportId}?error=${encodeURIComponent("Período inválido.")}`,
    );
  }

  try {
    await generateMonthlyReport(period.year, period.month);
  } catch (error) {
    redirect(
      `/dashboard/monthly-reports/${reportId}?error=${encodeURIComponent(messageOf(error))}`,
    );
  }

  revalidatePath("/dashboard/monthly-reports", "layout");
  redirect(`/dashboard/monthly-reports/${reportId}`);
}

/** Revisión de un hallazgo: disposición y medida adoptada (S5). */
export async function updateFindingAction(formData: FormData): Promise<void> {
  await requireAdmin();

  const id = textField(formData, "findingId");
  const disposition = textField(formData, "disposition");

  if (!(disposition in FindingDisposition)) {
    throw new Error("Disposición inválida.");
  }

  await prisma.reportFinding.update({
    where: { id },
    data: {
      disposition: disposition as FindingDisposition,
      measure: optionalTextField(formData, "measure") ?? null,
    },
  });

  revalidatePath("/dashboard/monthly-reports", "layout");
}

export type PeriodState = {
  coverage: PeriodCoverage;
  files: Awaited<ReturnType<typeof listPeriodFiles>>;
};

/**
 * Estado del período para la pantalla de preparación: qué días están cargados y
 * con qué archivos.
 *
 * Es de lectura y no crea nada: se pide antes de generar, cuando todavía no
 * existe un informe que consultar, y después de cada importación.
 */
export async function reportPeriodStateAction(
  year: number,
  month: number,
): Promise<PeriodState | null> {
  await requireAdmin();

  if (!Number.isInteger(year) || year < 2000 || year > 2100) return null;
  if (!Number.isInteger(month) || month < 1 || month > 12) return null;

  const period = monthlyPeriod(year, month);
  const [presentDays, files] = await Promise.all([
    listImportedDays(prisma, period),
    listPeriodFiles(prisma, period),
  ]);

  return { coverage: checkCoverage(period, presentDays), files };
}

/** Revisión en bloque: aplica la misma revisión a los hallazgos elegidos. */
export async function updateFindingsAction(formData: FormData): Promise<void> {
  await requireAdmin();

  const reportId = textField(formData, "reportId");
  const query = textField(formData, "query");
  const back = `/dashboard/monthly-reports/${reportId}`;
  const error = (message: string): string =>
    `${back}?${query.length > 0 ? `${query}&` : ""}error=${encodeURIComponent(message)}`;

  const disposition = textField(formData, "disposition");
  if (!(disposition in FindingDisposition)) {
    redirect(error("Revisión inválida."));
  }

  const ids = formData
    .getAll("findingId")
    .filter(
      (value): value is string => typeof value === "string" && value.length > 0,
    );

  if (ids.length === 0) {
    redirect(error("Elegí al menos un hallazgo."));
  }

  await prisma.reportFinding.updateMany({
    where: { id: { in: ids } },
    data: { disposition: disposition as FindingDisposition },
  });

  revalidatePath("/dashboard/monthly-reports", "layout");
  redirect(query.length > 0 ? `${back}?${query}` : back);
}
