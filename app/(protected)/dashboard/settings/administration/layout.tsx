import { requireAdmin } from "@/lib/requireAdmin";

export default async function AdministrationLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await requireAdmin();
  return children;
}
