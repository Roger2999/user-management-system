"use server";

import { SignFormState } from "@/lib/types";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/helpers/requireAdmin";
import { getSession } from "@/helpers/getSession";
import { AUDIT_ENTITY, recordAudit } from "@/lib/audit";
import { SignFormSchema } from "../models/signSchema.model";
import {
  STAGE_KEYS,
  emptySignValues,
  planSignatures,
  resolveSignerFields,
  toSignData,
  type SignValues,
  type StageKey,
} from "../models/signature-plan.model";
import { revalidatePath } from "next/cache";
import { AuditAction } from "@/generated/prisma/enums";
import type { Prisma } from "@/generated/prisma/client";
import z from "zod";

export const signAction = async (
  prevState: SignFormState,
  formData: FormData,
): Promise<SignFormState> => {
  await requireAdmin();

  // The operator identity comes from the session for their own stages
  // (Revised). requireAdmin already redirects without a session; this is
  // defence in depth for TypeScript and for anomalous runs.
  const session = await getSession();
  const sessionUser = session?.user;
  if (!sessionUser) {
    return {
      data: null,
      success: false,
      dbErrors: { message: "Sesión no válida. Vuelve a iniciar sesión." },
    };
  }

  const id = (formData.get("id") as string) ?? "";
  const checks = Object.fromEntries(
    STAGE_KEYS.map((key) => [key, formData.get(key) === "on"]),
  ) as Record<StageKey, boolean>;

  // Text value of a field, or null if it did not travel in the form
  // (disabled input / not rendered) or ended up empty.
  const formValue = (name: string): string | null => {
    const v = formData.get(name);
    return typeof v === "string" && v.trim().length > 0 ? v : null;
  };

  const current = await prisma.accountRequest.findUnique({
    where: { id },
    include: { signatures: true },
  });
  if (!current) {
    return {
      data: toSignData(emptySignValues({ id, checks })),
      success: false,
      dbErrors: { message: "No se encontró la solicitud de cuenta." },
    };
  }

  const resolved = resolveSignerFields(
    { id, checks },
    formValue,
    current.signatures,
    sessionUser,
  );

  const validatedFields = SignFormSchema.safeParse(resolved);
  if (!validatedFields.success) {
    return {
      data: toSignData(resolved),
      success: false,
      dbErrors: null,
      validationErrors: z.flattenError(validatedFields.error).fieldErrors,
    };
  }

  const values = validatedFields.data as SignValues;
  const plan = planSignatures(
    values,
    current.signatures,
    sessionUser,
    new Date(),
  );

  if (!plan.ok) {
    return {
      data: toSignData(values),
      success: false,
      dbErrors: { message: plan.message },
    };
  }

  try {
    if (plan.steps.length > 0) {
      const operations: Prisma.PrismaPromise<unknown>[] = plan.steps.map(
        (step) =>
          step.kind === "create"
            ? prisma.accountRequestSignature.create({
                data: {
                  accountRequestId: values.id,
                  stage: step.stage,
                  fullName: step.fullName,
                  position: step.position,
                  signedAt: step.signedAt,
                  registeredByUserId: sessionUser.id,
                  registeredByName: sessionUser.name,
                },
              })
            : prisma.accountRequestSignature.update({
                where: { id: step.id },
                data: {
                  fullName: step.fullName,
                  position: step.position,
                  correctionHistory: step.correctionHistory,
                },
              }),
      );

      operations.push(
        recordAudit(prisma, {
          action: AuditAction.SIGN,
          entityType: AUDIT_ENTITY.ACCOUNT_REQUEST,
          entityId: values.id,
          actor: {
            id: sessionUser.id,
            name: sessionUser.name ?? sessionUser.username,
          },
          metadata: {
            signedStages: plan.signedStages,
            corrections: plan.corrections,
          },
        }),
      );

      await prisma.$transaction(operations);
    }

    revalidatePath(
      `/dashboard/user-accounts-management/users/sign/${values.id}`,
    );
    return {
      data: toSignData(values),
      success: true,
      dbErrors: null,
    };
  } catch (error) {
    console.error("Error updating signs:", error);
    return {
      data: toSignData(values),
      success: false,
      dbErrors: { message: "Error al procesar las firmas. Intenta de nuevo." },
    };
  }
};
