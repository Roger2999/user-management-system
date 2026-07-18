import ForgotPasswordForm from "./components/forgot-password-form";

export default function ForgotPasswordPage() {
  return (
    <>
      <h1 className="text-2xl font-bold">¿Olvidaste tu contraseña?</h1>
      <p className="text-muted-foreground max-w-md text-center">
        Ingresa tu email y te enviaremos un enlace para restablecer tu
        contraseña.
      </p>
      <ForgotPasswordForm />
    </>
  );
}
