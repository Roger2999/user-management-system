"use client";
import Field from "@/components/field";
import { RequestPasswordResetState } from "@/lib/types";
import { useActionState } from "react";
import { requestPasswordResetAction } from "../actions/request-password-reset-action";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function ForgotPasswordForm() {
  const initialState: RequestPasswordResetState = {
    data: undefined,
    success: false,
    dbErrors: null,
    validationErrors: null,
  };
  const [state, action, pending] = useActionState(
    requestPasswordResetAction,
    initialState,
  );
  return (
    <form
      action={action}
      className="w-sm max-w-[80%] space-y-2 rounded-xl border p-10"
    >
      <Field
        label="Correo electrónico"
        name="email"
        type="email"
        errors={state.validationErrors?.email}
        defaultValue={state.data?.email}
      />
      <Button className="w-full" disabled={pending}>
        {pending ? "Enviando..." : "Enviar enlace"}
      </Button>
      {state.success && (
        <p className="text-success text-center text-sm">{state.message}</p>
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
