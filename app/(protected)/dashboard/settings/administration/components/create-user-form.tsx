"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import Field from "@/components/field";
import SelectField from "@/components/select-field";
import { Button } from "@/components/ui/button";
import { CreateSystemUserState } from "../models/administration-form-states";
import { createUserAction } from "../actions/create-user-action";

const ROLE_OPTIONS = [
  { value: "USER", label: "Usuario" },
  { value: "ADMIN", label: "Administrador" },
] as const;

export default function CreateUserForm() {
  const initialState: CreateSystemUserState = {
    data: undefined,
    success: false,
    message: undefined,
    dbErrors: null,
    validationErrors: null,
  };
  const [state, action, pending] = useActionState(
    createUserAction,
    initialState,
  );
  const [role, setRole] = useState("USER");
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success && state.message) {
      toast.success(state.message);
      // La contraseña temporal no se queda escrita en el DOM.
      formRef.current
        ?.querySelectorAll<HTMLInputElement>('input[type="password"]')
        .forEach((input) => {
          input.value = "";
        });
    } else if (state.dbErrors?.message) {
      toast.error(state.dbErrors.message);
    }
  }, [state]);

  return (
    <div className="space-y-4">
      <h3 className="text-base font-medium">Crear usuario</h3>
      <form
        ref={formRef}
        action={action}
        className="flex flex-col gap-2 rounded-xl border p-6"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Nombre y apellidos"
            name="fullName"
            defaultValue={state.data?.fullName}
            errors={state.validationErrors?.fullName}
          />
          <Field
            label="Nombre de usuario"
            name="username"
            defaultValue={state.data?.username}
            errors={state.validationErrors?.username}
          />
          <Field
            label="Correo electrónico"
            name="email"
            type="email"
            defaultValue={state.data?.email}
            errors={state.validationErrors?.email}
          />
          <Field
            label="Cargo"
            name="position"
            defaultValue={state.data?.position}
            errors={state.validationErrors?.position}
          />
          <SelectField
            label="Rol"
            name="role"
            options={ROLE_OPTIONS}
            value={role}
            onChange={setRole}
            errors={state.validationErrors?.role}
          />
          <Field
            label="Contraseña"
            name="password"
            type="password"
            autoComplete="new-password"
            errors={state.validationErrors?.password}
          />
        </div>
        <Button className="mt-4 self-start" type="submit" disabled={pending}>
          {pending ? "Creando..." : "Crear usuario"}
        </Button>
      </form>
    </div>
  );
}
