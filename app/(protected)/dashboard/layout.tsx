import { getSession } from "@/helpers/getSession";
import { redirect } from "next/navigation";
import BackButton from "./components/back-button";
import Breadcrumbs from "./components/breadcrumbs";


export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getSession();
  if (!session) {
    redirect("/signin");
  }

  return (
    <div className="min-h-layout-dashboard flex w-full flex-1 flex-col gap-6">
      <div className="flex w-full items-center justify-between px-5 pt-5 print:hidden">
        <BackButton />
      </div>
      <div className="print:hidden">
        <Breadcrumbs />
      </div>
      <div className="flex flex-1 flex-col">{children}</div>
    </div>
  );
}
