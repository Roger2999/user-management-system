import type { Prisma } from "@/lib/db";

const DAY_MS = 24 * 60 * 60 * 1000;

/** Cuentas temporales cuya fecha de expiración ya pasó. */
export function expiredAt(now: Date): Prisma.AccountRequestWhereInput {
  return { accountType: "TEMPORARY", expiresAt: { lte: now } };
}

/**
 * Cuentas temporales que expiran dentro de `days` días.
 *
 * Una sola definición de la ventana para que el listado, los contadores y las
 * notificaciones no calculen fechas distintas.
 */
export function expiringWithin(
  now: Date,
  days: number,
): Prisma.AccountRequestWhereInput {
  return {
    accountType: "TEMPORARY",
    expiresAt: { gte: now, lte: new Date(now.getTime() + days * DAY_MS) },
  };
}

/** Solicitudes a las que les falta al menos una de las cuatro firmas. */
export function pendingSignature(): Prisma.AccountRequestWhereInput {
  return {
    OR: [
      { signatures: { none: { stage: "requested" } } },
      { signatures: { none: { stage: "revised" } } },
      { signatures: { none: { stage: "approved" } } },
      { signatures: { none: { stage: "executed" } } },
    ],
  };
}
