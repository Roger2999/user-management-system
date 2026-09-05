"use client";
import Field from "@/components/field";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { UpdateUserState } from "@/lib/types";
import { UpdateUserAction } from "../actions/update-user-action";

type Props = {
  initialUser: { username: string; displayName: string };
};

export default function UpdateUserForm({ initialUser }: Props) {
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
    <div className="h-full space-y-4">
      <h2 className="text-xl font-semibold">Datos de la cuenta</h2>
      <form
        className="flex h-full flex-col space-y-2 rounded-xl border p-6"
        action={action}
      >
        <Field
          label="Nombre de usuario (login)"
          errors={state.validationErrors?.username}
          type="text"
          name="username"
          defaultValue={state.data?.username ?? initialUser.username}
        />
        <Field
          label="Nombre para mostrar"
          errors={state.validationErrors?.displayName}
          type="text"
          name="displayName"
          defaultValue={state.data?.displayName ?? initialUser.displayName}
        />
        <Button className="mt-auto">
          {pending ? "Enviando..." : "Guardar"}
        </Button>
        {state.success && <p className="text-success">{state.message}</p>}
        {state.dbErrors && (
          <p className="text-destructive">{state.dbErrors.message}</p>
        )}
      </form>
    </div>
  );
}
