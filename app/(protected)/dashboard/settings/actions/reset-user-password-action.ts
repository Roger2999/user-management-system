"use server";

import { randomUUID } from "node:crypto";
import z from "zod";
import { hashPassword } from "better-auth/crypto";
import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { getSession } from "@/helpers/getSession";
import { requireAdmin } from "@/helpers/requireAdmin";
import { AUDIT_ENTITY, recordAudit } from "@/lib/audit";
import type { ResetUserPasswordState } from "@/lib/types";
import { ResetUserPasswordSchema } from "../models/resetUserPasswordSchema.model";

/**
 * Restablece la contraseña de cualquier usuario del sistema.
 *
 * Es la salida de soporte cuando el correo de recuperación no llega (por
 * ejemplo, si el usuario se cargó sin email o con uno equivocado). Escribe el
 * hash con la misma función que usa el alta de usuarios, así el login por
 * username sigue verificando contra `account.password`.
 *
 * Revoca las sesiones abiertas del usuario destino: si la cuenta estaba
 * comprometida, un cambio de contraseña sin cerrar sesiones no expulsa a nadie.
 */
export async function resetUserPasswordAction(
  _prevState: ResetUserPasswordState,
  formData: FormData,
): Promise<ResetUserPasswordState> {
  await requireAdmin();

  const fields = {
    userId: (formData.get("userId") as string) ?? "",
    newPassword: (formData.get("newPassword") as string) ?? "",
    confirmNewPassword: (formData.get("confirmNewPassword") as string) ?? "",
  };

  const validatedFields = ResetUserPasswordSchema.safeParse(fields);

  if (!validatedFields.success) {
    return {
      data: { userId: fields.userId },
      success: false,
      dbErrors: null,
      validationErrors: z.flattenError(validatedFields.error).fieldErrors,
    };
  }

  const { userId, newPassword } = validatedFields.data;

  const target = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, username: true, fullName: true },
  });

  if (!target) {
    return {
      data: { userId },
      success: false,
      dbErrors: { message: "El usuario seleccionado no existe" },
      validationErrors: null,
    };
  }

  const session = await getSession();
  const isSelf = session?.user.id === target.id;
  const keepSessionId = isSelf ? session?.session.id : undefined;

  try {
    const hashedPassword = await hashPassword(newPassword);

    await prisma.$transaction(async (tx) => {
      const credentialAccount = await tx.account.findFirst({
        where: { userId: target.id, providerId: "credential" },
        select: { id: true },
      });

      if (credentialAccount) {
        await tx.account.update({
          where: { id: credentialAccount.id },
          data: { password: hashedPassword },
        });
      } else {
        // Sin restricción única en (userId, providerId), dos resets simultáneos
        // de una cuenta sin contraseña podrían crear dos filas de credenciales.
        // El login lee la primera, así que la ventana requiere concurrencia real.
        await tx.account.create({
          data: {
            id: randomUUID(),
            accountId: target.id,
            providerId: "credential",
            userId: target.id,
            password: hashedPassword,
          },
        });
      }

      await tx.session.deleteMany({
        where: {
          userId: target.id,
          ...(keepSessionId ? { id: { not: keepSessionId } } : {}),
        },
      });

      await recordAudit(tx, {
        action: "UPDATE",
        entityType: AUDIT_ENTITY.USER,
        entityId: target.id,
        actor: session
          ? { id: session.user.id, name: session.user.name }
          : null,
        metadata: { event: "password-reset", resetBySelf: isSelf },
      });
    });
  } catch (error) {
    console.error("resetUserPasswordAction: error al restablecer", error);
    return {
      data: { userId },
      success: false,
      dbErrors: {
        message: "Error al restablecer la contraseña. Intenta de nuevo.",
      },
      validationErrors: null,
    };
  }

  try {
    revalidatePath("/dashboard/settings");
  } catch (error) {
    // El reset ya se confirmó: un fallo de revalidación no debe reportarse
    // como fallo del cambio de contraseña.
    console.error("resetUserPasswordAction: error al revalidar", error);
  }

  return {
    data: { userId },
    success: true,
    message: `Contraseña restablecida para «${target.username ?? target.fullName}»`,
    dbErrors: null,
    validationErrors: null,
  };
}
