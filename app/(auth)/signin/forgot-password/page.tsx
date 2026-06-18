import ForgotPasswordForm from "./components/forgot-password-form";

export default function ForgotPasswordPage() {
  return (
    <div className="flex flex-col items-center justify-center gap-10">
      <h1>Ingresa tu email para restablecer la contraseña</h1>
      <ForgotPasswordForm />
    </div>
  );
}
