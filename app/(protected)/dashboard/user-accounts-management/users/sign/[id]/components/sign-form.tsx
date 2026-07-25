"use client";

import { Button } from "@/components/ui/button";
import { SignFormState } from "@/lib/types";
import { useActionState, useEffect } from "react";
import { signAction } from "../actions/sign-action";
import { toast } from "sonner";
import CheckboxField from "@/components/checkbox-field";

export interface SignValues {
  requested: boolean;
  revised: boolean;
  approved: boolean;
  executed: boolean;
}

interface Props {
  id?: string;
  initial?: SignValues;
}

const initialState: SignFormState = {
  data: null,
  success: false,
  dbErrors: null,
};

const FIELDS: { key: keyof SignValues; label: string }[] = [
  { key: "requested", label: "Solicitado" },
  { key: "revised", label: "Revisado" },
  { key: "approved", label: "Aprobado" },
  { key: "executed", label: "Ejecutado" },
];

export default function SignForm({ id, initial }: Props) {
  const [state, action, pending] = useActionState(signAction, initialState);

  useEffect(() => {
    if (state.success) {
      toast.success("Firmas verificadas");
    }
  }, [state]);

  const signs: SignValues = {
    requested: state.data?.requested ?? initial?.requested ?? false,
    revised: state.data?.revised ?? initial?.revised ?? false,
    approved: state.data?.approved ?? initial?.approved ?? false,
    executed: state.data?.executed ?? initial?.executed ?? false,
  };

  return (
    <form action={action} className="flex w-full flex-col gap-8">
      <input type="hidden" name="id" value={id} />
      {FIELDS.map(({ key, label }) =>
        signs[key] ? (
          <div key={key} className="flex items-center gap-2 text-sm">
            <input type="hidden" name={key} value="on" />
            <input
              type="checkbox"
              checked
              disabled
              readOnly
              className="accent-primary size-6"
            />
            <span className="">{label} (firmado)</span>
          </div>
        ) : (
          <CheckboxField key={key} label={label} name={key} />
        ),
      )}

      <Button disabled={pending} size={"lg"}>
        {pending ? "Guardando..." : "Guardar cambios"}
      </Button>
      {state.dbErrors && (
        <p className="text-destructive">{state.dbErrors?.message}</p>
      )}
    </form>
  );
}
