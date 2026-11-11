import { requireAdmin } from "@/lib/requireAdmin";

export default async function UserAccountsManagementLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await requireAdmin();

  return <>{children}</>;
}
