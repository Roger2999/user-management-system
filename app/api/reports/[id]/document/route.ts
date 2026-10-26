import { NextResponse } from "next/server";
import { getSession } from "@/helpers/getSession";
import prisma from "@/lib/prisma";
import { readReportDocument } from "@/lib/reports/storage";

/** Descarga del `.docx` emitido. Solo administradores y solo el archivo guardado. */

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const session = await getSession();
  if (session === null) {
    return new NextResponse("No autenticado.", { status: 401 });
  }
  if (session.user.role !== "ADMIN") {
    return new NextResponse("No autorizado.", { status: 403 });
  }

  const { id } = await context.params;
  const report = await prisma.monthlyReport.findUnique({
    where: { id },
    select: { year: true, month: true, docxSha256: true },
  });

  if (report === null || report.docxSha256 === null) {
    return new NextResponse("El informe no tiene documento emitido.", {
      status: 404,
    });
  }

  try {
    const bytes = await readReportDocument(report.year, report.month);

    return new NextResponse(Buffer.from(bytes), {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="informe-${report.year}-${String(report.month).padStart(2, "0")}.docx"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch {
    return new NextResponse(
      "El documento no está disponible; regenerá el informe.",
      { status: 404 },
    );
  }
}
