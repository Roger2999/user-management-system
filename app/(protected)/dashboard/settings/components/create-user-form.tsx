"use client";

import { useActionState, useState } from "react";
import Field from "@/components/field";
import SelectField from "@/components/select-field";
import { Button } from "@/components/ui/button";
import { CreateSystemUserState } from "@/lib/types";
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

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Crear usuario</h2>
      <form
        action={action}
        className="flex h-full flex-col gap-2 rounded-xl border p-6"
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
        <Button className="mt-4 self-start">
          {pending ? "Creando..." : "Crear usuario"}
        </Button>
        {state.success && <p className="text-success">{state.message}</p>}
        {state.dbErrors && (
          <p className="text-destructive">{state.dbErrors.message}</p>
        )}
      </form>
    </div>
  );
}
