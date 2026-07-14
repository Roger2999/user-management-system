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
    <form action={action} className="space-y-2 border p-10 rounded-xl w-sm max-w-[80%]">
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
        <p className="text-sm text-success text-center">{state.message}</p>
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
