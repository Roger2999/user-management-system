"use client";

import Field from "@/components/field";
import { Button } from "@/components/ui/button";
import { ResetPasswordState } from "@/lib/types";
import { useActionState } from "react";
import { resetPasswordAction } from "../actions/reset-password-action";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

export default function ResetPasswordForm() {
  const initialState: ResetPasswordState = {
    success: false,
    dbErrors: null,
    validationErrors: null,
  };
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [state, action, pending] = useActionState(
    resetPasswordAction,
    initialState,
  );

  return (
    <form
      action={action}
      className="space-y-2 border p-10 rounded-xl w-sm max-w-[80%]"
    >
      <input type="hidden" name="token" value={token ? token : undefined} />
      <Field
        label="Nueva contraseña"
        name="newPassword"
        type="password"
        errors={state.validationErrors?.newPassword}
      />
      <Field
        label="Confirmar contraseña"
        name="confirmNewPassword"
        type="password"
        errors={state.validationErrors?.confirmNewPassword}
      />
      <Button className="w-full" disabled={pending}>
        {pending ? "Actualizando..." : "Actualizar contraseña"}
      </Button>
      {state.success && (
        <p className="text-sm text-success text-center">
          Contraseña actualizada correctamente
        </p>
      )}
      {state.dbErrors && (
        <p className="text-sm text-destructive text-center">
          {state.dbErrors.message}
        </p>
      )}
      <div className="text-center text-sm">
        <Link href="/signin" className="hover:border-b border-b-border">
          Volver al inicio de sesión
        </Link>
      </div>
    </form>
  );
}
