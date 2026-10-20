"use client";
import Field from "@/components/field";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { UpdateUserState } from "@/lib/types";
import { UpdateUserAction } from "../actions/update-user-action";

type Props = {
  initialUser: {
    username: string;
    displayName: string;
    position: string | null;
  };
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
    <div className="flex h-full flex-col gap-4">
      <h2 className="text-xl font-semibold">Datos de la cuenta</h2>
      <form
        className="flex flex-1 flex-col space-y-2 rounded-xl border p-6"
        action={action}
      >
        <Field
          label="Nombre de usuario"
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
        <Field
          label="Cargo (aparece en tus firmas)"
          errors={state.validationErrors?.position}
          type="text"
          name="position"
          defaultValue={state.data?.position ?? initialUser.position ?? ""}
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
