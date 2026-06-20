import VerifyEmailForm from "./components/verify-email-form";

export default async function VerifyEmailAddressPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const { email } = await searchParams;

  if (!email) {
    return (
      <div className="border p-10 rounded-xl w-sm max-w-[80%] text-center">
        <p className="text-sm text-muted-foreground">
          No se proporcionó un email válido.
        </p>
      </div>
    );
  }

  return <VerifyEmailForm email={email} />;
}
