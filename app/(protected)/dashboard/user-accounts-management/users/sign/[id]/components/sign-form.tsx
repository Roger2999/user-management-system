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
  currentUser?: { name: string; cargo: string | null };
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

// Etapas que firma el propio operador desde su sesión: no admiten texto
// libre, su nombre/cargo provienen de la cuenta autenticada.
const ETAPAS_PROPIAS: (keyof SignValues)[] = ["revised", "executed"];

// Reconstruye un SignValues completo a partir de una fuente parcial
// (el `initial` de la página o el `state.data` del último envío).
function resolveValues(
  source: Partial<SignValues> | null | undefined,
): SignValues {
  return {
    requested: source?.requested ?? false,
    requestedNombre: source?.requestedNombre ?? "",
    requestedCargo: source?.requestedCargo ?? "",
    revised: source?.revised ?? false,
    revisedNombre: source?.revisedNombre ?? "",
    revisedCargo: source?.revisedCargo ?? "",
    approved: source?.approved ?? false,
    approvedNombre: source?.approvedNombre ?? "",
    approvedCargo: source?.approvedCargo ?? "",
    executed: source?.executed ?? false,
    executedNombre: source?.executedNombre ?? "",
    executedCargo: source?.executedCargo ?? "",
  };
}

export default function SignForm({ id, initial, currentUser }: Props) {
  const [state, action, pending] = useActionState(signAction, initialState);

  // Estado local de los checkboxes de las etapas propias: permite mostrar
  // la vista previa "Firmará" apenas el operador marca el checkbox, sin
  // esperar a que el formulario se envíe.
  const [checksPropios, setChecksPropios] = useState<
    Partial<Record<keyof SignValues, boolean>>
  >({});

  useEffect(() => {
    if (state.success) {
      toast.success("Firmas verificadas");
    }
  }, [state]);

  // Lo que el usuario intentó en el último envío (para no perder lo escrito
  // cuando la validación falla).
  const attempted = resolveValues(state.data);

  // Qué hay realmente persistido en la DB: solo esto bloquea la edición.
  // Un fallo de validación o negocio no escribió nada; usar el intento como
  // "firmado" congelaba la etapa sin permitir corregir los errores.
  const persisted: SignValues = state.success
    ? attempted
    : resolveValues(initial);

  // Valores a mostrar: si el último envío falló por validación, el intento;
  // en cualquier otro caso (éxito, error de negocio, primera carga), lo que
  // realmente está en la DB vía `initial`.
  const shown: SignValues =
    state.data && !state.dbErrors ? attempted : persisted;

  // Una etapa solo se puede firmar si la anterior ya está firmada en la DB.
  const canSign: Record<keyof SignValues, boolean> = {
    requested: !persisted.requested,
    requestedNombre: false,
    requestedCargo: false,
    revised: !persisted.revised && persisted.requested,
    revisedNombre: false,
    revisedCargo: false,
    approved: !persisted.approved && persisted.revised,
    approvedNombre: false,
    approvedCargo: false,
    executed: !persisted.executed && persisted.approved,
    executedNombre: false,
    executedCargo: false,
  };

  return (
    <form action={action} className="flex w-full flex-col gap-8">
      <input type="hidden" name="id" value={id} />
      {FIELDS.map(({ key, label }) => {
        const signed = Boolean(persisted[key]);
        // Los inputs quedan editables mientras la etapa sea alcanzable
        // (la anterior firmada) o ya esté firmada: las etapas externas
        // admiten corrección de errores de tipeo, sin poder desfirmar.
        const stageReady = canSign[key] || signed;
        const inputsDisabled = !stageReady;
        const esPropia = ETAPAS_PROPIAS.includes(key as keyof SignValues);
        const nombreKey = `${key}Nombre` as keyof SignValues;
        const cargoKey = `${key}Cargo` as keyof SignValues;
        const nombreValue = shown[nombreKey] as string;
        const cargoValue = shown[cargoKey] as string;
        const marcadoHoy =
          !signed && (checksPropios[key] || Boolean(shown[key]));
        const errorPropio =
          state.validationErrors?.[`${key}Nombre`]?.[0] ??
          state.validationErrors?.[`${key}Cargo`]?.[0];
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
                    setChecksPropios((prev) => ({ ...prev, [key]: checked }))
                  }
                />
              )}
            </div>
            {esPropia ? (
              <div>
                {signed ? (
                  <p className="text-muted-foreground text-sm">
                    Firmado por: {nombreValue} — {cargoValue}
                  </p>
                ) : marcadoHoy ? (
                  <p className="text-muted-foreground text-sm">
                    Firmará: {currentUser?.name} —{" "}
                    {currentUser?.cargo ??
                      "sin cargo (configuralo en Ajustes)"}
                  </p>
                ) : null}
                {!signed && errorPropio && (
                  <p className="text-destructive text-sm">{errorPropio}</p>
                )}
              </div>
            ) : (
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