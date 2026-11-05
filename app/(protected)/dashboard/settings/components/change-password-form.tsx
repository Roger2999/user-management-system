"use client";

import { useActionState, useEffect, useRef } from "react";
import { toast } from "sonner";
import Field from "@/components/field";
import { Button } from "@/components/ui/button";
import { ChangePasswordState } from "@/app/(protected)/dashboard/settings/models/settings-form-states";
import { changePasswordAction } from "../actions/change-password-action";

export default function ChangePasswordForm() {
  const initialState: ChangePasswordState = {
    message: undefined,
    success: false,
    dbErrors: null,
    validationErrors: null,
  };
  const [state, action, pending] = useActionState(
    changePasswordAction,
    initialState,
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success && state.message) {
      toast.success(state.message);
      // Ninguna de las contraseñas se queda escrita en el DOM.
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
    <div className="flex flex-col gap-4">
      <h3 className="text-base font-medium">Cambiar contraseña</h3>
      <form
        ref={formRef}
        className="flex flex-col space-y-2 rounded-xl border p-6"
        action={action}
      >
        <Field
          label="Contraseña actual"
          errors={state.validationErrors?.currentPassword}
          type="password"
          name="currentPassword"
          autoComplete="current-password"
        />
        <Field
          label="Nueva contraseña"
          errors={state.validationErrors?.newPassword}
          type="password"
          name="newPassword"
          autoComplete="new-password"
        />
        <Field
          label="Confirmar nueva contraseña"
          errors={state.validationErrors?.confirmNewPassword}
          type="password"
          name="confirmNewPassword"
          autoComplete="new-password"
        />
        <Button className="mt-2 self-start" type="submit" disabled={pending}>
          {pending ? "Enviando..." : "Actualizar"}
        </Button>
      </form>
    </div>
  );
}
