"use client";

import { Button } from "@/components/ui/button";
import { SignFormState } from "@/lib/types";
import { useActionState, useEffect, useState } from "react";
import { signAction } from "../actions/sign-action";
import { toast } from "sonner";
import CheckboxField from "@/components/checkbox-field";
import Field from "@/components/field";
import { CheckCheck } from "lucide-react";

export interface SignValues {
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
}

interface Props {
  id: string;
  initial?: SignValues;
  currentUser?: { name: string; position: string | null };
}

const initialState: SignFormState = {
  data: null,
  success: false,
  dbErrors: null,
};

const FIELDS: { key: keyof SignValues; label: string }[] = [
  { key: "requested", label: "Solicitado (Director que solicita el servicio)" },
  {
    key: "revised",
    label: "Revisado (Especialista o Técnico de Seguridad Informática)",
  },
  { key: "approved", label: "Aprobado (Director General o persona designada)" },
  {
    key: "executed",
    label: "Ejecutado (Especialista que configura la cuenta y los servicios)",
  },
];

// Stage the operator signs themselves from their session: no free text,
// name/position come from the authenticated account.
const OWN_STAGES: (keyof SignValues)[] = ["revised"];

// Rebuilds a complete SignValues from a partial source
// (the page `initial` or the `state.data` of the last submit).
function resolveValues(
  source: Partial<SignValues> | null | undefined,
): SignValues {
  return {
    requested: source?.requested ?? false,
    requestedName: source?.requestedName ?? "",
    requestedPosition: source?.requestedPosition ?? "",
    revised: source?.revised ?? false,
    revisedName: source?.revisedName ?? "",
    revisedPosition: source?.revisedPosition ?? "",
    approved: source?.approved ?? false,
    approvedName: source?.approvedName ?? "",
    approvedPosition: source?.approvedPosition ?? "",
    executed: source?.executed ?? false,
    executedName: source?.executedName ?? "",
    executedPosition: source?.executedPosition ?? "",
  };
}

export default function SignForm({ id, initial, currentUser }: Props) {
  const [state, action, pending] = useActionState(signAction, initialState);

  // Local state of the checkboxes for the operator's own stages: lets the
  // "Will sign" preview show as soon as the operator ticks the checkbox,
  // without waiting for the form to be submitted.
  const [ownChecks, setOwnChecks] = useState<
    Partial<Record<keyof SignValues, boolean>>
  >({});

  useEffect(() => {
    if (state.success) {
      toast.success("Firmas verificadas");
    }
  }, [state]);

  // What the user tried to submit last time (so nothing typed is lost
  // when validation fails).
  const attempted = resolveValues(state.data);

  // What is actually persisted in the DB: only this blocks editing.
  // A validation or business failure wrote nothing; using the attempt as
  // "signed" froze the stage without allowing errors to be corrected.
  const persisted: SignValues = state.success
    ? attempted
    : resolveValues(initial);

  // Values to show: if the last submit failed validation, the attempt;
  // otherwise (success, business error, first load), what is really
  // in the DB via `initial`.
  const shown: SignValues =
    state.data && !state.dbErrors ? attempted : persisted;

  // A stage can only be signed if the previous one is already signed in the DB.
  const canSign: Record<keyof SignValues, boolean> = {
    requested: !persisted.requested,
    requestedName: false,
    requestedPosition: false,
    revised: !persisted.revised && persisted.requested,
    revisedName: false,
    revisedPosition: false,
    approved: !persisted.approved && persisted.revised,
    approvedName: false,
    approvedPosition: false,
    executed: !persisted.executed && persisted.approved,
    executedName: false,
    executedPosition: false,
  };

  return (
    <form action={action} className="flex w-full flex-col gap-8">
      <input type="hidden" name="id" value={id} />
      {FIELDS.map(({ key, label }) => {
        const signed = Boolean(persisted[key]);
        // Inputs stay editable while the stage is reachable (the previous one
        // signed) or already signed: external stages accept typo corrections
        // without being able to be unsigned.
        const stageReady = canSign[key] || signed;
        const inputsDisabled = !stageReady;
        const isOwn = OWN_STAGES.includes(key as keyof SignValues);
        const nameKey = `${key}Name` as keyof SignValues;
        const positionKey = `${key}Position` as keyof SignValues;
        const nameValue = shown[nameKey] as string;
        const positionValue = shown[positionKey] as string;
        const markedToday =
          !signed && (ownChecks[key] || Boolean(shown[key]));
        const ownError =
          state.validationErrors?.[`${key}Name`]?.[0] ??
          state.validationErrors?.[`${key}Position`]?.[0];
        return (
          <div
            key={key}
            className="flex w-full flex-col gap-4 rounded-lg border p-4"
          >
            <div className="flex items-center gap-2">
              {signed ? (
                <>
                  <input type="hidden" name={key} value="on" />
                  <input
                    type="checkbox"
                    checked
                    disabled
                    readOnly
                    className="accent-primary size-6"
                  />
                  <span className="text-success flex gap-4">
                    {label}
                    <CheckCheck className="relative -top-4 right-4 size-6" />
                  </span>
                </>
              ) : (
                <CheckboxField
                  label={label}
                  name={key}
                  disabled={!stageReady}
                  onChange={(checked) =>
                    setOwnChecks((prev) => ({ ...prev, [key]: checked }))
                  }
                />
              )}
            </div>
            {isOwn ? (
              <div>
                {signed ? (
                  <p className="text-muted-foreground text-sm">
                    Firmado por: {nameValue} — {positionValue}
                  </p>
                ) : markedToday ? (
                  <p className="text-muted-foreground text-sm">
                    Firmará: {currentUser?.name} —{" "}
                    {currentUser?.position ??
                      "sin cargo (configuralo en Ajustes)"}
                  </p>
                ) : null}
                {!signed && ownError && (
                  <p className="text-destructive text-sm">{ownError}</p>
                )}
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  label="Nombre y apellidos"
                  name={`${key}Name`}
                  defaultValue={nameValue}
                  disabled={inputsDisabled}
                  errors={state.validationErrors?.[`${key}Name`]}
                />
                <Field
                  label="Cargo"
                  name={`${key}Position`}
                  defaultValue={positionValue}
                  disabled={inputsDisabled}
                  errors={state.validationErrors?.[`${key}Position`]}
                />
              </div>
            )}
          </div>
        );
      })}

      <Button disabled={pending} size={"lg"}>
        {pending ? "Guardando..." : "Guardar cambios"}
      </Button>
      {state.dbErrors && (
        <p className="text-destructive">{state.dbErrors?.message}</p>
      )}
    </form>
  );
}
