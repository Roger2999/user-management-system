export default async function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex w-full flex-col items-center justify-start gap-5 min-h-[80dvh] mt-20">
      {children}
    </div>
  );
}
