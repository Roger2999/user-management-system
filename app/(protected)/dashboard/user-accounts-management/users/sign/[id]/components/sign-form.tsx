"use client";

import { Button } from "@/components/ui/button";
import { SignFormState } from "@/lib/types";
import { useActionState, useEffect } from "react";
import { signAction } from "../actions/sign-action";
import { toast } from "sonner";
import CheckboxField from "@/components/checkbox-field";
import Field from "@/components/field";
import { CheckCheck } from "lucide-react";

export interface SignValues {
  requested: boolean;
  requestedNombre: string;
  requestedCargo: string;
  revised: boolean;
  revisedNombre: string;
  revisedCargo: string;
  approved: boolean;
  approvedNombre: string;
  approvedCargo: string;
  executed: boolean;
  executedNombre: string;
  executedCargo: string;
}

interface Props {
  id: string;
  initial?: SignValues;
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

export default function SignForm({ id, initial }: Props) {
  const [state, action, pending] = useActionState(signAction, initialState);

  useEffect(() => {
    if (state.success) {
      toast.success("Firmas verificadas");
    }
  }, [state]);

  // Ante un error de negocio (inmutabilidad u orden), el servidor no
  // persistió los cambios: reconciliar contra el estado real de la DB.
  const signs: SignValues = state.dbErrors
    ? {
        requested: initial?.requested ?? false,
        requestedNombre: initial?.requestedNombre ?? "",
        requestedCargo: initial?.requestedCargo ?? "",
        revised: initial?.revised ?? false,
        revisedNombre: initial?.revisedNombre ?? "",
        revisedCargo: initial?.revisedCargo ?? "",
        approved: initial?.approved ?? false,
        approvedNombre: initial?.approvedNombre ?? "",
        approvedCargo: initial?.approvedCargo ?? "",
        executed: initial?.executed ?? false,
        executedNombre: initial?.executedNombre ?? "",
        executedCargo: initial?.executedCargo ?? "",
      }
    : {
        requested: state.data?.requested ?? initial?.requested ?? false,
        requestedNombre:
          state.data?.requestedNombre ?? initial?.requestedNombre ?? "",
        requestedCargo:
          state.data?.requestedCargo ?? initial?.requestedCargo ?? "",
        revised: state.data?.revised ?? initial?.revised ?? false,
        revisedNombre: state.data?.revisedNombre ?? initial?.revisedNombre ?? "",
        revisedCargo: state.data?.revisedCargo ?? initial?.revisedCargo ?? "",
        approved: state.data?.approved ?? initial?.approved ?? false,
        approvedNombre:
          state.data?.approvedNombre ?? initial?.approvedNombre ?? "",
        approvedCargo: state.data?.approvedCargo ?? initial?.approvedCargo ?? "",
        executed: state.data?.executed ?? initial?.executed ?? false,
        executedNombre:
          state.data?.executedNombre ?? initial?.executedNombre ?? "",
        executedCargo: state.data?.executedCargo ?? initial?.executedCargo ?? "",
      };

  // Una etapa solo se puede firmar si la anterior ya está firmada.
  const canSign: Record<keyof SignValues, boolean> = {
    requested: !signs.requested,
    requestedNombre: false,
    requestedCargo: false,
    revised: !signs.revised && signs.requested,
    revisedNombre: false,
    revisedCargo: false,
    approved: !signs.approved && signs.revised,
    approvedNombre: false,
    approvedCargo: false,
    executed: !signs.executed && signs.approved,
    executedNombre: false,
    executedCargo: false,
  };

  return (
    <form action={action} className="flex w-full flex-col gap-8">
      <input type="hidden" name="id" value={id} />
      {FIELDS.map(({ key, label }) => {
        const signed = Boolean(signs[key]);
        const stageReady = canSign[key];
        const inputsDisabled = signed || !stageReady;
        const nombreKey = `${key}Nombre` as keyof SignValues;
        const cargoKey = `${key}Cargo` as keyof SignValues;
        const nombreValue = signs[nombreKey] as string;
        const cargoValue = signs[cargoKey] as string;
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
                <CheckboxField label={label} name={key} disabled={!stageReady} />
              )}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Nombre y apellidos"
                name={`${key}Nombre`}
                defaultValue={nombreValue}
                disabled={inputsDisabled}
                errors={state.validationErrors?.[`${key}Nombre`]}
              />
              <Field
                label="Cargo"
                name={`${key}Cargo`}
                defaultValue={cargoValue}
                disabled={inputsDisabled}
                errors={state.validationErrors?.[`${key}Cargo`]}
              />
            </div>
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