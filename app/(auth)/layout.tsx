export default async function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-layout-auth w-full flex-col items-center justify-center gap-6">
      {children}
    </div>
  );
}
