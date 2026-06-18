"use client";
import Field from "@/components/field";
import { RequestPasswordResetState } from "@/lib/types";
import { useActionState } from "react";
import { requestPasswordResetAction } from "../actions/request-password-reset-action";
import { Button } from "@/components/ui/button";

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
    <form className="w-md max-w-[80%] p-10 border rounded-xl" action={action}>
      <Field
        errors={state.validationErrors?.email}
        type="text"
        name="email"
        defaultValue={state.data?.email}
        className=""
      />
      <Button>{pending ? "Loading..." : "Enviar"}</Button>
      {state.success && <p className="text-green-500">{state.message}</p>}
      {state.dbErrors && (
        <p className="text-red-500">{state.dbErrors.message}</p>
      )}
    </form>
  );
}
