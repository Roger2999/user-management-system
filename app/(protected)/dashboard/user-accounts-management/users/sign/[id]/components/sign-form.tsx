"use client";

import { Button } from "@/components/ui/button";
import { SignFormState } from "@/lib/types";
import { useActionState, useEffect } from "react";
import { signAction } from "../actions/sign-action";
import { toast } from "sonner";
import CheckboxField from "@/components/checkbox-field";
import { CheckCheck } from "lucide-react";

export interface SignValues {
  requested: boolean;
  revised: boolean;
  approved: boolean;
  executed: boolean;
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
          <div key={key} className="flex items-center gap-2 text-xl">
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
