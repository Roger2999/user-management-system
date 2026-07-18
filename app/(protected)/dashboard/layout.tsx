import { getSession } from "@/helpers/getSession";
import { redirect } from "next/navigation";
import BackButton from "./components/back-button";

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
      <BackButton className="relative top-5 left-5" />
      {children}
    </div>
  );
}
