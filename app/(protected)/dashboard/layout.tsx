import { getSession } from "@/helpers/getSession";
import { redirect } from "next/navigation";
import BackButton from "./components/back-button";
import NotificationData from "./components/notification-data";

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
    <div className="flex w-full flex-col gap-6">
      <div className="flex w-full items-center justify-between px-5 pt-5 print:hidden">
        <NotificationData />
        <BackButton />
      </div>
      <div className="mb-10">{children}</div>
    </div>
  );
}
