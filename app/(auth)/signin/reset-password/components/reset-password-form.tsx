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
      className="w-sm max-w-[80%] space-y-2 rounded-xl border p-10"
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
        <p className="text-success text-center text-sm">
          Contraseña actualizada correctamente
        </p>
      )}
      {state.dbErrors && (
        <p className="text-destructive text-center text-sm">
          {state.dbErrors.message}
        </p>
      )}
      <div className="text-center text-sm">
        <Link href="/signin" className="border-b-border hover:border-b">
          Volver al inicio de sesión
        </Link>
      </div>
    </form>
  );
}
