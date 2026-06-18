"use client";

import Field from "@/components/field";
import { Button } from "@/components/ui/button";
import { ResetPasswordState } from "@/lib/types";
import { useActionState } from "react";
import { resetPasswordAction } from "../actions/reset-password-action";
import { useSearchParams } from "next/navigation";

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
        label="Contraseña actual"
        name="currentPassword"
        type="password"
        errors={state.validationErrors?.currentPassword}
      />
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
        {pending ? "Loading..." : "Sign up"}
      </Button>
      {state.dbErrors && (
        <p className="text-sm text-red-500 text-center">
          {state.dbErrors.message}
        </p>
      )}
    </form>
  );
}
