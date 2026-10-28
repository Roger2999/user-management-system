import { requireAdmin } from "@/helpers/requireAdmin";
import Sidebar from "./components/sidebar/sidebar";

export default async function MonthlyReportManagementLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await requireAdmin();
  return (
    <div className="flex min-h-[70dvh] w-full flex-col gap-6 md:flex-row">
      <Sidebar />
      <section className="flex min-w-0 flex-1 flex-col items-center">
        {children}
      </section>
    </div>
  );
}
