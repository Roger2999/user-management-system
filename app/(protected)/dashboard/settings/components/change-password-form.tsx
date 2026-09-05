"use client";

import Field from "@/components/field";
import { Button } from "@/components/ui/button";
import { useActionState } from "react";
import { ChangePasswordState } from "@/lib/types";
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
  return (
    <div className="h-full space-y-4">
      <h2 className="text-xl font-semibold">Cambiar contraseña</h2>
      <form
        className="flex h-full flex-col space-y-2 rounded-xl border p-6"
        action={action}
      >
        <Field
          label="Contraseña actual"
          errors={state.validationErrors?.currentPassword}
          type="password"
          name="currentPassword"
        />
        <Field
          label="Nueva contraseña"
          errors={state.validationErrors?.newPassword}
          type="password"
          name="newPassword"
        />
        <Field
          label="Confirmar nueva contraseña"
          errors={state.validationErrors?.confirmNewPassword}
          type="password"
          name="confirmNewPassword"
        />
        <Button className="mt-auto">
          {pending ? "Enviando..." : "Actualizar"}
        </Button>
        {state.success && <p className="text-success">{state.message}</p>}
        {state.dbErrors && (
          <p className="text-destructive">{state.dbErrors.message}</p>
        )}
      </form>
    </div>
  );
}