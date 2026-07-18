"use client";

import Field from "@/components/field";
import { Button } from "@/components/ui/button";
import { useActionState } from "react";
import { signinAction } from "../actions/signin-action";
import { SigninFormState } from "@/lib/types";
import Link from "next/link";

export default function SigninForm() {
  const initialState: SigninFormState = {
    data: undefined,
    success: false,
    dbErrors: null,
    validationErrors: null,
  };
  const [state, action, pending] = useActionState(signinAction, initialState);
  return (
    <form
      action={action}
      className="w-sm max-w-[80%] space-y-2 rounded-xl border p-10"
    >
      <Field
        defaultValue={state.data?.email}
        label="Correo electrónico"
        name="email"
        errors={state.validationErrors?.email}
      />
      <Field
        label="Contraseña"
        name="password"
        type="password"
        errors={state.validationErrors?.password}
      />
      <div className="flex justify-end">
        <Link
          href={"/signin/forgot-password"}
          className="border-b-border text-sm hover:border-b"
        >
          ¿Has olvidado la contraseña?
        </Link>
      </div>
      <Button className="mt-4 w-full" disabled={pending}>
        {pending ? "Cargando..." : "Iniciar sesión"}
      </Button>
      {state.dbErrors && (
        <p className="text-destructive text-center text-sm">
          {state.dbErrors.message}
        </p>
      )}
    </form>
  );
}
