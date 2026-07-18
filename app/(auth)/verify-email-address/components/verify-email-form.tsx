"use client";

import { Button } from "@/components/ui/button";
import { Mail } from "lucide-react";
import Link from "next/link";
import { useActionState } from "react";
import { toast } from "sonner";
import { resendVerificationAction } from "../actions/resend-verification-action";
import { ResendVerificationState } from "@/lib/types";

interface Props {
  email: string;
}

export default function VerifyEmailForm({ email }: Props) {
  const initialState: ResendVerificationState = {
    data: { email },
    success: false,
    dbErrors: null,
    validationErrors: null,
  };
  const [state, action, pending] = useActionState(
    resendVerificationAction,
    initialState,
  );

  if (state.success) {
    toast.success("Correo de verificación reenviado");
  }

  return (
    <div className="w-sm max-w-[80%] space-y-6 rounded-xl border p-10 text-center">
      <div className="flex justify-center">
        <Mail className="text-muted-foreground size-12" />
      </div>
      <div className="space-y-2">
        <h1 className="text-xl font-semibold">Verifica tu email</h1>
        <p className="text-muted-foreground text-sm">
          Hemos enviado un enlace de verificación a
        </p>
        <p className="text-sm font-medium">{email}</p>
      </div>
      <p className="text-muted-foreground text-xs">
        Haz clic en el enlace del correo para completar tu registro. El enlace
        expira en 24 horas.
      </p>
      <div className="space-y-3">
        <form action={action}>
          <input type="hidden" name="email" value={email} />
          <Button
            type="submit"
            variant="outline"
            className="w-full"
            disabled={pending}
          >
            {pending ? "Reenviando..." : "Reenviar correo"}
          </Button>
        </form>
        {state.dbErrors && (
          <p className="text-destructive text-center text-sm">
            {state.dbErrors.message}
          </p>
        )}
        <Link
          href="/signin"
          className="text-muted-foreground block text-sm hover:underline"
        >
          Volver al inicio de sesión
        </Link>
      </div>
    </div>
  );
}
