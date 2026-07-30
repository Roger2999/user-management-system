export default async function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-layout-auth flex w-full flex-col items-center justify-center gap-6">
      {children}
    </div>
  );
}
