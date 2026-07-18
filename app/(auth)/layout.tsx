export default async function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="mt-20 flex min-h-[80dvh] w-full flex-col items-center justify-start gap-5">
      {children}
    </div>
  );
}
