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
      className="space-y-2 border p-10 rounded-xl w-sm max-w-[80%]"
    >
      <Field
        defaultValue={state.data?.email}
        label="Email"
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
          className="text-sm hover:border-b border-b-white"
        >
          ¿Has olvidado la contraseña?
        </Link>
      </div>
      <Button className="w-full mt-4" disabled={pending}>
        {pending ? "Loading..." : "Sign in"}
      </Button>
      {state.dbErrors && (
        <p className="text-sm text-center text-red-500">
          {state.dbErrors.message}
        </p>
      )}
    </form>
  );
}
