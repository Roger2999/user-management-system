import SideBar from "./components/sidebar";

export default async function MonthlyReportManagementLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-[90dvh] w-full pt-4">
      <SideBar />
      <div className="flex w-full min-w-xl flex-1 flex-col items-center">
        {children}
      </div>
    </div>
  );
}
