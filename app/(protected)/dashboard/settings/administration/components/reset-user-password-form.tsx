"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import Field from "@/components/field";
import SelectField from "@/components/select-field";
import { Button } from "@/components/ui/button";
import type { ResetUserPasswordState } from "../models/administration-form-states";
import { resetUserPasswordAction } from "../actions/reset-user-password-action";

type Props = {
  users: { value: string; label: string }[];
};

const initialState: ResetUserPasswordState = {
  data: undefined,
  success: false,
  message: undefined,
  dbErrors: null,
  validationErrors: null,
};

export default function ResetUserPasswordForm({ users }: Props) {
  const [state, action, pending] = useActionState(
    resetUserPasswordAction,
    initialState,
  );
  const [userId, setUserId] = useState("");
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success && state.message) {
      toast.success(state.message);
      // La contraseña no se queda escrita en el DOM después de aplicarla.
      formRef.current
        ?.querySelectorAll<HTMLInputElement>('input[type="password"]')
        .forEach((input) => {
          input.value = "";
        });
    } else if (state.dbErrors?.message) {
      toast.error(state.dbErrors.message);
    }
  }, [state]);

  return (
    <div className="space-y-4">
      <h3 className="text-base font-medium">Restablecer contraseña</h3>
      <form
        ref={formRef}
        action={action}
        className="grid gap-4 rounded-xl border p-6 sm:grid-cols-2 lg:grid-cols-3"
      >
        <SelectField
          label="Usuario"
          name="userId"
          options={users}
          value={userId}
          onChange={setUserId}
          errors={state.validationErrors?.userId}
        />
        <Field
          label="Nueva contraseña"
          name="newPassword"
          type="password"
          autoComplete="new-password"
          errors={state.validationErrors?.newPassword}
        />
        <Field
          label="Confirmar contraseña"
          name="confirmNewPassword"
          type="password"
          autoComplete="new-password"
          errors={state.validationErrors?.confirmNewPassword}
        />
        <p className="text-muted-foreground text-sm sm:col-span-2 lg:col-span-3">
          Se cerrarán las sesiones activas de esa cuenta. La contraseña nueva
          debe entregarse por un canal seguro y el usuario debe cambiarla al
          ingresar.
        </p>
        <Button
          className="self-start sm:col-span-2 lg:col-span-3"
          type="submit"
          disabled={pending}
        >
          {pending ? "Restableciendo..." : "Restablecer contraseña"}
        </Button>
      </form>
    </div>
  );
}
