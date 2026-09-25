import { requireAdmin } from "@/helpers/requireAdmin";

export default async function UserAccountsManagementLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await requireAdmin();

  return <>{children}</>;
}