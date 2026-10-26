import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";

/**
 * Compatibilidad con la URL vieja `/summary?id=...`.
 *
 * El detalle ahora es una ruta real (`/[id]`). Si llega un `id`, se redirige
 * ahí; sin `id`, al último informe, y si no hay ninguno, a la lista.
 */
export default async function SummaryRedirectPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string | string[] }>;
}) {
  const { id } = await searchParams;
  const raw = Array.isArray(id) ? id[0] : id;
  const trimmed = raw?.trim();

  if (trimmed !== undefined && trimmed.length > 0) {
    redirect(
      `/dashboard/monthly-report-management/${encodeURIComponent(trimmed)}`,
    );
  }

  const latest = await prisma.monthlyReport.findFirst({
    orderBy: [{ year: "desc" }, { month: "desc" }],
    select: { id: true },
  });

  redirect(
    latest === null
      ? "/dashboard/monthly-report-management"
      : `/dashboard/monthly-report-management/${latest.id}`,
  );
}
