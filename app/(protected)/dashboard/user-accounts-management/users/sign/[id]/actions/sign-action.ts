"use server";

import { SignFormState } from "@/lib/types";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/helpers/requireAdmin";
import { getSession } from "@/helpers/getSession";
import { SignFormSchema, SIGN_STAGES } from "../models/signSchema.model";
import { revalidatePath } from "next/cache";
import { AccountRequestStage } from "@/generated/prisma/enums";
import type { Prisma } from "@/generated/prisma/client";
import z from "zod";

type StageKey = (typeof SIGN_STAGES)[number]["key"];

// Text field keys (name/position) of the signature form.
type TextFieldKey =
  | "requestedName"
  | "requestedPosition"
  | "revisedName"
  | "revisedPosition"
  | "approvedName"
  | "approvedPosition"
  | "executedName"
  | "executedPosition";

type SignFields = {
  id: string;
  requested: boolean;
  requestedName: string;
  requestedPosition: string;
  revised: boolean;
  revisedName: string;
  revisedPosition: string;
  approved: boolean;
  approvedName: string;
  approvedPosition: string;
  executed: boolean;
  executedName: string;
  executedPosition: string;
};

const stageToEnum: Record<StageKey, AccountRequestStage> = {
  requested: "requested",
  revised: "revised",
  approved: "approved",
  executed: "executed",
};

/** Stages the operator signs themselves (specialist) from their session. */
const OWN_STAGES: AccountRequestStage[] = ["revised"];

/** One entry of the correction history of a registered signature. */
type CorrectionEntry = {
  field: "name" | "position";
  previousValue: string;
  newValue: string;
  editedByUser: string;
  date: string;
};

function toData(f: SignFields) {
  return {
    requested: f.requested,
    requestedName: f.requestedName,
    requestedPosition: f.requestedPosition,
    revised: f.revised,
    revisedName: f.revisedName,
    revisedPosition: f.revisedPosition,
    approved: f.approved,
    approvedName: f.approvedName,
    approvedPosition: f.approvedPosition,
    executed: f.executed,
    executedName: f.executedName,
    executedPosition: f.executedPosition,
  };
}

export const signAction = async (
  prevState: SignFormState,
  formData: FormData,
): Promise<SignFormState> => {
  await requireAdmin();

  // The operator identity comes from the session for their own stages
  // (Revised/Executed). requireAdmin already redirects without a session; this
  // is defence in depth for TypeScript and for anomalous runs.
  const session = await getSession();
  const sessionUser = session?.user;
  if (!sessionUser) {
    return {
      data: null,
      success: false,
      dbErrors: { message: "Sesión no válida. Vuelve a iniciar sesión." },
    };
  }
  const operatorName =
    (sessionUser.name ?? "").trim() || (sessionUser.username ?? "").trim();
  const operatorPosition = (sessionUser.position ?? "").trim();

  const fields: SignFields = {
    id: (formData.get("id") as string) ?? "",
    requested: formData.get("requested") === "on",
    requestedName: "",
    requestedPosition: "",
    revised: formData.get("revised") === "on",
    revisedName: "",
    revisedPosition: "",
    approved: formData.get("approved") === "on",
    approvedName: "",
    approvedPosition: "",
    executed: formData.get("executed") === "on",
    executedName: "",
    executedPosition: "",
  };

  // Text value of a field, or null if it did not travel in the form
  // (disabled input / not rendered) or ended up empty.
  const formValue = (name: string): string | null => {
    const v = formData.get(name);
    return typeof v === "string" && v.trim().length > 0 ? v : null;
  };

  const current = await prisma.accountRequest.findUnique({
    where: { id: fields.id },
    include: { signatures: true },
  });
  if (!current) {
    return {
      data: toData(fields),
      success: false,
      dbErrors: { message: "No se encontró la solicitud de cuenta." },
    };
  }

  const signatureByStage = new Map(
    current.signatures.map((sig) => [sig.stage, sig]),
  );

  // Per stage: signer identity and values used for validation.
  for (const stage of SIGN_STAGES) {
    const enumStage = stageToEnum[stage.key];
    const sig = signatureByStage.get(enumStage);
    const isOwn = OWN_STAGES.includes(enumStage);
    const nameKey = `${stage.key}Name` as TextFieldKey;
    const positionKey = `${stage.key}Position` as TextFieldKey;

    if (isOwn) {
      // Specialist stages: identity comes from the session and NEVER from the
      // form (the client does not even render inputs for them).
      fields[nameKey] = operatorName;
      fields[positionKey] = operatorPosition;
      continue;
    }

    // External stages (Requested/Approved): free text from the operator,
    // faithfully recording what was signed on paper. If the input did not
    // travel (disabled by stage order) and the stage is already signed, the
    // real DB values are used so validation does not fail.
    const nameForm = formValue(`${stage.key}Name`);
    const positionForm = formValue(`${stage.key}Position`);
    fields[nameKey] = nameForm ?? (sig ? sig.fullName : "");
    fields[positionKey] = positionForm ?? (sig ? sig.position : "");
  }

  const validatedFields = SignFormSchema.safeParse(fields);
  if (!validatedFields.success) {
    return {
      data: toData(fields),
      success: false,
      dbErrors: null,
      validationErrors: z.flattenError(validatedFields.error).fieldErrors,
    };
  }

  const id = validatedFields.data.id;
  const signs = toData(validatedFields.data as SignFields);

  const existingStages = new Set(current.signatures.map((sig) => sig.stage));

  // Immutability: a stage that is already signed cannot be unsigned.
  for (const stage of SIGN_STAGES) {
    if (existingStages.has(stageToEnum[stage.key]) && !signs[stage.key]) {
      return {
        data: signs,
        success: false,
        dbErrors: {
          message: `La firma de «${stage.label}» ya está registrada y no se puede revertir.`,
        },
      };
    }
  }

  // Flow order: to sign a stage, the previous one must already be signed.
  for (let i = 1; i < SIGN_STAGES.length; i++) {
    const stage = SIGN_STAGES[i];
    const prev = SIGN_STAGES[i - 1];
    const previousSigned =
      signs[prev.key] || existingStages.has(stageToEnum[prev.key]);
    if (signs[stage.key] && !previousSigned) {
      return {
        data: signs,
        success: false,
        dbErrors: {
          message: `Para firmar «${stage.label}» primero debe estar firmado «${prev.label}».`,
        },
      };
    }
  }

  const editedByUser = sessionUser.username ?? sessionUser.id;

  // Per-stage operations: create new signatures and correct existing ones.
  const operations: Prisma.PrismaPromise<unknown>[] = [];

  for (const stage of SIGN_STAGES) {
    const enumStage = stageToEnum[stage.key];
    const sig = signatureByStage.get(enumStage);
    const nameKey = `${stage.key}Name` as TextFieldKey;
    const positionKey = `${stage.key}Position` as TextFieldKey;

    if (!sig) {
      // No previous signature: only created if the checkbox is ticked.
      if (signs[stage.key]) {
        operations.push(
          prisma.accountRequestSignature.create({
            data: {
              accountRequestId: id,
              stage: enumStage,
              fullName: signs[nameKey],
              position: signs[positionKey],
              signedAt: new Date(),
              registeredByUserId: sessionUser.id,
              registeredByName: sessionUser.name,
            },
          }),
        );
      }
      continue;
    }

    // Existing signature (the client forces the checkbox to "on", so
    // immutability was already validated above): if name/position changed,
    // they are corrected and the entries are appended to the history.
    const newName = signs[nameKey];
    const newPosition = signs[positionKey];
    const corrections: CorrectionEntry[] = [];
    if (sig.fullName !== newName) {
      corrections.push({
        field: "name",
        previousValue: sig.fullName,
        newValue: newName,
        editedByUser,
        date: new Date().toISOString(),
      });
    }
    if (sig.position !== newPosition) {
      corrections.push({
        field: "position",
        previousValue: sig.position,
        newValue: newPosition,
        editedByUser,
        date: new Date().toISOString(),
      });
    }
    if (corrections.length > 0) {
      const previousHistory =
        (sig.correctionHistory ?? []) as unknown as CorrectionEntry[];
      operations.push(
        prisma.accountRequestSignature.update({
          where: { id: sig.id },
          data: {
            fullName: newName,
            position: newPosition,
            correctionHistory: [...previousHistory, ...corrections],
          },
        }),
      );
    }
  }

  try {
    if (operations.length > 0) {
      await prisma.$transaction(operations);
    }
    revalidatePath(`/dashboard/user-accounts-management/users/sign/${id}`);
    return {
      data: signs,
      success: true,
      dbErrors: null,
    };
  } catch (error) {
    console.error("Error updating signs:", error);
    return {
      data: signs,
      success: false,
      dbErrors: { message: "Error al procesar las firmas. Intenta de nuevo." },
    };
  }
};