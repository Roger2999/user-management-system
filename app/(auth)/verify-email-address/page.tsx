import VerifyEmailForm from "./components/verify-email-form";

export default async function VerifyEmailAddressPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const { email } = await searchParams;

  if (!email) {
    return (
      <div className="w-sm max-w-[80%] rounded-xl border p-10 text-center">
        <p className="text-muted-foreground text-sm">
          No se proporcionó un correo válido.
        </p>
      </div>
    );
  }

  return <VerifyEmailForm email={email} />;
}
