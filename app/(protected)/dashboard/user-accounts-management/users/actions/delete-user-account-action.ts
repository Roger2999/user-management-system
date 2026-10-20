"use server";

import z from "zod";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/helpers/requireAdmin";
import { getSession } from "@/helpers/getSession";
import { AUDIT_ENTITY, recordAudit } from "@/lib/audit";
import { AuditAction } from "@/generated/prisma/enums";
import { DeleteUserAccountState } from "@/lib/types";

const DeleteUserAccountSchema = z.object({
  id: z.string().min(1, "ID inválido").max(100, "Máximo 100 caracteres"),
});

export async function deleteUserAccountAction(
  _prevState: DeleteUserAccountState,
  formData: FormData,
): Promise<DeleteUserAccountState> {
  await requireAdmin();

  const fields = {
    id: (formData.get("id") as string) || "",
  };

  const validatedFields = DeleteUserAccountSchema.safeParse(fields);

  if (!validatedFields.success) {
    return {
      success: false,
      dbErrors: { message: "ID inválido" },
    };
  }

  const { id } = validatedFields.data;

  const request = await prisma.accountRequest.findUnique({
    where: { id },
    select: {
      folio: true,
      fullName: true,
      _count: { select: { signatures: true } },
    },
  });

  if (!request) {
    return {
      success: false,
      dbErrors: { message: "La solicitud no existe." },
    };
  }

  // Una solicitud firmada es evidencia de un proceso: no se borra.
  if (request._count.signatures > 0) {
    return {
      success: false,
      dbErrors: {
        message:
          "No se puede eliminar una solicitud que ya tiene firmas registradas.",
      },
    };
  }

  const session = await getSession();
  const actor = session?.user
    ? { id: session.user.id, name: session.user.name ?? session.user.username }
    : null;

  try {
    await prisma.$transaction(async (tx) => {
      const { count } = await tx.accountRequest.deleteMany({
        where: { id, signatures: { none: {} } },
      });

      if (count === 0) {
        throw new Error(
          "La solicitud fue firmada o eliminada por otro usuario.",
        );
      }

      await recordAudit(tx, {
        action: AuditAction.DELETE,
        entityType: AUDIT_ENTITY.ACCOUNT_REQUEST,
        entityId: id,
        actor,
        metadata: { folio: request.folio, fullName: request.fullName },
      });
    });

    revalidatePath("/dashboard/user-accounts-management/users");
    return { success: true, dbErrors: null };
  } catch (error) {
    console.error("deleteUserAccountAction: error al eliminar", error);
    return {
      success: false,
      dbErrors: {
        message: "Error al eliminar la solicitud. Intenta de nuevo.",
      },
    };
  }
}
