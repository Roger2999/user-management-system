"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/helpers/requireAdmin";
import { optionalTextField, textField } from "@/lib/form-data";
import prisma from "@/lib/prisma";
import { generateMonthlyReport, ReportGenerationError } from "@/lib/reports/generate";
import { FindingDisposition } from "@/generated/prisma/enums";

export type GenerateReportState = { error?: string };

function messageOf(error: unknown): string {
  if (error instanceof ReportGenerationError) return error.message;
  if (
    error instanceof Error &&
    (error as NodeJS.ErrnoException).code === "ENOENT"
  ) {
    return "No se encontró la plantilla oficial. Configurá REPORTS_TEMPLATE_PATH.";
  }
  return error instanceof Error
    ? error.message
    : "No se pudo generar el informe.";
}

function periodFrom(formData: FormData): { year: number; month: number } | null {
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

/** Genera el informe y redirige al detalle. Se usa con `useActionState`. */
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

  revalidatePath("/dashboard/monthly-report-management", "layout");
  redirect(`/dashboard/monthly-report-management/${id}`);
}

/** Regenera el informe desde el detalle. Se usa como `action` de un formulario. */
export async function regenerateReportAction(formData: FormData): Promise<void> {
  await requireAdmin();

  const reportId = textField(formData, "reportId");
  const period = periodFrom(formData);

  if (period === null) {
    redirect(
      `/dashboard/monthly-report-management/${reportId}?error=${encodeURIComponent("Período inválido.")}`,
    );
  }

  try {
    await generateMonthlyReport(period.year, period.month);
  } catch (error) {
    redirect(
      `/dashboard/monthly-report-management/${reportId}?error=${encodeURIComponent(messageOf(error))}`,
    );
  }

  revalidatePath("/dashboard/monthly-report-management", "layout");
  redirect(`/dashboard/monthly-report-management/${reportId}`);
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

  revalidatePath("/dashboard/monthly-report-management", "layout");
}
