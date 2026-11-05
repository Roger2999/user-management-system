"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import Field from "@/components/field";
import { Button } from "@/components/ui/button";
import { UpdateUserState } from "@/app/(protected)/dashboard/settings/models/settings-form-states";
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

  useEffect(() => {
    if (state.success && state.message) {
      toast.success(state.message);
    } else if (state.dbErrors?.message) {
      toast.error(state.dbErrors.message);
    }
  }, [state]);

  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-base font-medium">Datos de la cuenta</h3>
      <form
        className="flex flex-col space-y-2 rounded-xl border p-6"
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
        <Button className="mt-2 self-start" type="submit" disabled={pending}>
          {pending ? "Enviando..." : "Guardar"}
        </Button>
      </form>
    </div>
  );
}
