import { AccountRequestStage } from "@/generated/prisma/enums";
import { SIGN_STAGES } from "./signSchema.model";

/**
 * Pure signature-flow rules.
 *
 * Everything here is free of Next.js, Prisma and FormData so it can be tested
 * without mocks. The server action is responsible for reading the form, the
 * session and persisting the plan.
 */

/** Stage keys in flow order. */
export type StageKey = (typeof SIGN_STAGES)[number]["key"];

export const STAGE_KEYS = SIGN_STAGES.map((stage) => stage.key) as StageKey[];

export const STAGE_ENUM: Record<StageKey, AccountRequestStage> = {
  requested: "requested",
  revised: "revised",
  approved: "approved",
  executed: "executed",
};

/**
 * Stages whose signer is the operator themself: identity comes from the
 * session and the form never provides it.
 */
export const OWN_STAGES: AccountRequestStage[] = ["revised"];

export function isOwnStage(stage: AccountRequestStage): boolean {
  return OWN_STAGES.includes(stage);
}

/** Name/position keys of a stage, e.g. `revised` -> `revisedName`. */
type TextFieldKey =
  | "requestedName"
  | "requestedPosition"
  | "revisedName"
  | "revisedPosition"
  | "approvedName"
  | "approvedPosition"
  | "executedName"
  | "executedPosition";

/** Checkbox state read from the form, plus the request id. */
export type SubmittedSign = {
  id: string;
  checks: Record<StageKey, boolean>;
};

/** Signature already persisted for a request. */
export type SignatureRow = {
  id: string;
  stage: AccountRequestStage;
  fullName: string;
  position: string;
  correctionHistory?: unknown;
};

/** Signed-in operator. */
export type SignatureOperator = {
  id: string;
  name?: string | null;
  username?: string | null;
  position?: string | null;
};

/** One change made to a signature that was already registered. */
export type CorrectionEntry = {
  field: "name" | "position";
  previousValue: string;
  newValue: string;
  editedByUser: string;
  date: string;
};

/** Every field the sign form submits, after identity resolution. */
export type SignValues = {
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

/** Unit of work the action must persist, in flow order. */
export type SignatureStep =
  | {
      kind: "create";
      stage: AccountRequestStage;
      fullName: string;
      position: string;
      signedAt: Date;
    }
  | {
      kind: "update";
      id: string;
      fullName: string;
      position: string;
      correctionHistory: CorrectionEntry[];
    };

export type SignaturePlan =
  | { ok: false; message: string }
  | {
      ok: true;
      steps: SignatureStep[];
      signedStages: AccountRequestStage[];
      corrections: {
        stage: AccountRequestStage;
        field: CorrectionEntry["field"];
        previousValue: string;
        newValue: string;
      }[];
    };

/** Values with every stage unsigned and every text field empty. */
export function emptySignValues(submitted: SubmittedSign): SignValues {
  return {
    id: submitted.id,
    requested: submitted.checks.requested,
    requestedName: "",
    requestedPosition: "",
    revised: submitted.checks.revised,
    revisedName: "",
    revisedPosition: "",
    approved: submitted.checks.approved,
    approvedName: "",
    approvedPosition: "",
    executed: submitted.checks.executed,
    executedName: "",
    executedPosition: "",
  };
}

/**
 * Resolves the name and position of every stage.
 *
 * - Own stages take the operator identity from the session and ignore the form.
 * - External stages keep the free text the operator typed, so the signature
 *   records what was actually signed on paper.
 * - When an external stage is already signed and its input did not travel
 *   (disabled by stage order), the persisted values are reused so validation
 *   does not fail.
 */
export function resolveSignerFields(
  submitted: SubmittedSign,
  readFormValue: (name: string) => string | null,
  existing: SignatureRow[],
  operator: SignatureOperator,
): SignValues {
  const signatureByStage = new Map(existing.map((sig) => [sig.stage, sig]));
  const operatorName =
    (operator.name ?? "").trim() || (operator.username ?? "").trim();
  const operatorPosition = (operator.position ?? "").trim();

  const values = emptySignValues(submitted);

  for (const { key } of SIGN_STAGES) {
    const stage = STAGE_ENUM[key];
    const nameKey = `${key}Name` as TextFieldKey;
    const positionKey = `${key}Position` as TextFieldKey;

    if (isOwnStage(stage)) {
      values[nameKey] = operatorName;
      values[positionKey] = operatorPosition;
      continue;
    }

    const sig = signatureByStage.get(stage);
    values[nameKey] =
      readFormValue(`${key}Name`) ?? (sig ? sig.fullName : "");
    values[positionKey] =
      readFormValue(`${key}Position`) ?? (sig ? sig.position : "");
  }

  return values;
}

/**
 * Applies the flow rules to the submitted values and returns the steps to
 * persist.
 *
 * Rules:
 * - A signed stage can never be unsigned (signatures are evidence).
 * - A stage can only be signed when the previous one is signed.
 * - Changing the name or position of a signed stage is recorded as a
 *   correction, appending to its history.
 */
export function planSignatures(
  values: SignValues,
  existing: SignatureRow[],
  operator: SignatureOperator,
  now: Date = new Date(),
): SignaturePlan {
  const signatureByStage = new Map(existing.map((sig) => [sig.stage, sig]));
  const existingStages = new Set(existing.map((sig) => sig.stage));

  // Immutability: a stage that is already signed cannot be unsigned.
  for (const { key, label } of SIGN_STAGES) {
    if (existingStages.has(STAGE_ENUM[key]) && !values[key]) {
      return {
        ok: false,
        message: `La firma de «${label}» ya está registrada y no se puede revertir.`,
      };
    }
  }

  // Flow order: to sign a stage, the previous one must already be signed.
  for (let i = 1; i < SIGN_STAGES.length; i++) {
    const stage = SIGN_STAGES[i];
    const prev = SIGN_STAGES[i - 1];
    const previousSigned =
      values[prev.key] || existingStages.has(STAGE_ENUM[prev.key]);
    if (values[stage.key] && !previousSigned) {
      return {
        ok: false,
        message: `Para firmar «${stage.label}» primero debe estar firmado «${prev.label}».`,
      };
    }
  }

  const editedByUser = operator.username ?? operator.id;
  const steps: SignatureStep[] = [];
  const signedStages: AccountRequestStage[] = [];
  const corrections: {
    stage: AccountRequestStage;
    field: CorrectionEntry["field"];
    previousValue: string;
    newValue: string;
  }[] = [];

  for (const { key } of SIGN_STAGES) {
    const stage = STAGE_ENUM[key];
    const sig = signatureByStage.get(stage);
    const nameKey = `${key}Name` as TextFieldKey;
    const positionKey = `${key}Position` as TextFieldKey;

    if (!sig) {
      // No previous signature: it is only created when the box is ticked.
      if (values[key]) {
        signedStages.push(stage);
        steps.push({
          kind: "create",
          stage,
          fullName: values[nameKey],
          position: values[positionKey],
          signedAt: now,
        });
      }
      continue;
    }

    // Existing signature: the client forces the box to "on", so immutability
    // was already validated above. If name or position changed, they are
    // corrected and the entries appended to the history.
    const newName = values[nameKey];
    const newPosition = values[positionKey];
    const entries: CorrectionEntry[] = [];

    if (sig.fullName !== newName) {
      entries.push({
        field: "name",
        previousValue: sig.fullName,
        newValue: newName,
        editedByUser,
        date: now.toISOString(),
      });
    }
    if (sig.position !== newPosition) {
      entries.push({
        field: "position",
        previousValue: sig.position,
        newValue: newPosition,
        editedByUser,
        date: now.toISOString(),
      });
    }

    if (entries.length > 0) {
      corrections.push(
        ...entries.map((entry) => ({
          stage,
          field: entry.field,
          previousValue: entry.previousValue,
          newValue: entry.newValue,
        })),
      );

      const previousHistory = (sig.correctionHistory ??
        []) as unknown as CorrectionEntry[];

      steps.push({
        kind: "update",
        id: sig.id,
        fullName: newName,
        position: newPosition,
        correctionHistory: [...previousHistory, ...entries],
      });
    }
  }

  return { ok: true, steps, signedStages, corrections };
}

/** UI-facing payload of the sign form: the request id is not echoed back. */
export type SignData = Omit<SignValues, "id">;

export function toSignData(values: SignValues): SignData {
  return {
    requested: values.requested,
    requestedName: values.requestedName,
    requestedPosition: values.requestedPosition,
    revised: values.revised,
    revisedName: values.revisedName,
    revisedPosition: values.revisedPosition,
    approved: values.approved,
    approvedName: values.approvedName,
    approvedPosition: values.approvedPosition,
    executed: values.executed,
    executedName: values.executedName,
    executedPosition: values.executedPosition,
  };
}
