import { requireAdmin } from "@/helpers/requireAdmin";
import NotificationData from "../components/notification-data";

export default async function UserAccountsManagementLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await requireAdmin();

  return (
    <>
      <div className="relative -top-26 z-20 flex w-full justify-end px-4">
        <NotificationData />
      </div>
      {children};
    </>
  );
}
