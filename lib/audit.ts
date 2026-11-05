import { AuditAction, type Prisma } from "@/lib/db";

/** Entidades auditables. */
export const AUDIT_ENTITY = {
  ACCOUNT_REQUEST: "AccountRequest",
  USER: "User",
} as const;

export type AuditActor = {
  id: string;
  name?: string | null;
} | null;

/**
 * Escribe una entrada de auditoria. Acepta tanto el cliente normal como un
 * cliente de transaccion, para poder registrar dentro de la misma operacion.
 */
export function recordAudit(
  db: Prisma.TransactionClient,
  data: {
    action: AuditAction;
    entityType: string;
    entityId: string;
    actor: AuditActor;
    metadata?: Prisma.InputJsonValue;
  },
) {
  return db.auditLog.create({
    data: {
      action: data.action,
      entityType: data.entityType,
      entityId: data.entityId,
      actorUserId: data.actor?.id ?? null,
      actorName: data.actor?.name?.trim() || null,
      metadata: data.metadata,
    },
  });
}
