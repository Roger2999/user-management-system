"use client";
import { useActionState } from "react";
import { Button } from "./ui/button";
import { signoutAction } from "@/app/(auth)/signout/actions/signout-action";
import { SignoutFormState } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function SignoutButton() {
  const initialState: SignoutFormState = {
    success: false,
    dbErrors: null,
  };
  const [state, action, pending] = useActionState(signoutAction, initialState);
  return (
    <form action={action}>
      <Button
        className={cn(state.dbErrors && "border border-destructive")}
      >
        {pending ? "Cerrando sesión..." : "Cerrar sesión"}
      </Button>
    </form>
  );
}
