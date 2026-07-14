"use client";

import Field from "@/components/field";
import { Button } from "@/components/ui/button";
import { useActionState } from "react";
import { signupAction } from "../actions/signup-action";
import { SignupFormState } from "@/lib/types";

export default function SignupForm() {
  const initialState: SignupFormState = {
    success: false,
    data: undefined,
    dbErrors: null,
    validationErrors: null,
  };
  const [state, action, pending] = useActionState(signupAction, initialState);
  return (
    <form
      action={action}
      className="space-y-2 border p-10 rounded-xl w-sm max-w-[80%]"
    >
      <Field
        label="Nombre de usuario"
        name="username"
        errors={state.validationErrors?.username}
        defaultValue={state.data?.username}
      />
      <Field
        label="Correo electrónico"
        name="email"
        errors={state.validationErrors?.email}
        defaultValue={state.data?.email}
      />
      <Field
        label="Contraseña"
        name="password"
        type="password"
        errors={state.validationErrors?.password}
      />
      <Field
        label="Confirmar contraseña"
        name="confirmPassword"
        type="password"
        errors={state.validationErrors?.confirmPassword}
      />
      <Button className="w-full" disabled={pending}>
        {pending ? "Cargando..." : "Registrarse"}
      </Button>
      {state.dbErrors && (
        <p className="text-sm text-destructive text-center">
          {state.dbErrors.message}
        </p>
      )}
    </form>
  );
}
