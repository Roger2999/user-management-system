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
    <div>
      <h2>Cambiar nombre de usuario</h2>
      <form className="w-md max-w-[80%] p-10 border rounded-xl" action={action}>
        <Field
          label="Nuevo username"
          errors={state.validationErrors?.username}
          type="text"
          name="username"
          defaultValue={state.data?.username}
        />
        <Button>{pending ? "Loading..." : "Enviar"}</Button>
        {state.success && <p className="text-green-500">{state.message}</p>}
        {state.dbErrors && (
          <p className="text-red-500">{state.dbErrors.message}</p>
        )}
      </form>
    </div>
  );
}
