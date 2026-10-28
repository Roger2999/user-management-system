import { Readable } from "node:stream";
import { NextResponse } from "next/server";
import { getSession } from "@/helpers/getSession";
import prisma from "@/lib/prisma";
import { importSquidLogFile } from "@/lib/reports/persistence/import";
import { monthlyPeriod } from "@/lib/reports/time";

/**
 * Importa un archivo diario de Squid.
 *
 * El cuerpo se lee como stream: un `access.log` real ronda los 90 MB y el
 * límite de 1 MB de las server actions no aplica. El nombre y el período viajan
 * en cabeceras porque el cuerpo es el archivo crudo, sin multipart.
 */

export const runtime = "nodejs";
export const maxDuration = 300;

function decodeFileName(raw: string | null): string | null {
  if (raw === null) return null;
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  const session = await getSession();
  if (session === null) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  }
  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }

  const fileName = decodeFileName(request.headers.get("x-file-name"));
  const year = Number(request.headers.get("x-period-year"));
  const month = Number(request.headers.get("x-period-month"));

  const validPeriod =
    Number.isInteger(year) &&
    Number.isInteger(month) &&
    month >= 1 &&
    month <= 12;

  if (fileName === null || fileName.trim() === "" || !validPeriod) {
    return NextResponse.json(
      { error: "Faltan el nombre del archivo o el período." },
      { status: 400 },
    );
  }

  if (request.body === null) {
    return NextResponse.json(
      { error: "El archivo llegó vacío." },
      { status: 400 },
    );
  }

  try {
    const result = await importSquidLogFile(prisma, {
      fileName,
      stream: Readable.fromWeb(
        request.body as unknown as import("node:stream/web").ReadableStream,
      ),
      period: monthlyPeriod(year, month),
      importedById: session.user.id,
    });

    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "No se pudo importar el archivo.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
