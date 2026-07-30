"use client";
import Field from "@/components/field";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { UpdateUserState } from "@/lib/types";
import { UpdateUserAction } from "../actions/update-user-action";

export default function UpdateUserForm() {
  const initialState: UpdateUserState = {
    data: undefined,
    success: false,
    message: undefined,
    dbErrors: null,
    validationErrors: null,
  };
  const [state, action, pending] = useActionState(
    UpdateUserAction,
    initialState,
  );
  return (
    <section className="xs:grid-cols-2 grid w-7xl max-w-full grid-cols-1 gap-10 md:grid-cols-3">
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Cambiar nombre de usuario</h2>
        <form className="space-y-2 rounded-xl border p-6" action={action}>
          <Field
            label="Nuevo nombre de usuario"
            errors={state.validationErrors?.username}
            type="text"
            name="username"
            defaultValue={state.data?.username}
          />
          <Button>{pending ? "Enviando..." : "Guardar"}</Button>
          {state.success && <p className="text-success">{state.message}</p>}
          {state.dbErrors && (
            <p className="text-destructive">{state.dbErrors.message}</p>
          )}
        </form>
      </div>
    </section>
  );
}
