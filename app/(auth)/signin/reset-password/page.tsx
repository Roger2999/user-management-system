import { Suspense } from "react";
import ResetPasswordForm from "./components/reset-password-form";

export default function ResetPasswordPage() {
  return (
    <>
      <h1 className="text-2xl font-bold">Restablecer contraseña</h1>
      <p className="text-muted-foreground text-center max-w-md">
        Ingresa tu nueva contraseña a continuación.
      </p>
      <Suspense fallback={<p>Cargando...</p>}>
        <ResetPasswordForm />
      </Suspense>
    </>
  );
}
