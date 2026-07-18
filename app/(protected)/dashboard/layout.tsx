import { getSession } from "@/helpers/getSession";
import { redirect } from "next/navigation";
import BackButton from "./components/back-button";
import NotificationBell from "./components/notification-bell";
import prisma from "@/lib/prisma";
import { expiringAccountsFilter } from "@/lib/filters";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getSession();
  if (!session) {
    redirect("/signin");
  }

  const expiring7 = expiringAccountsFilter.find(
    (f) => f.value === "expiring7",
  )!;
  const expiring1 = expiringAccountsFilter.find(
    (f) => f.value === "expiring1",
  )!;

  const [count7, count1, accounts] = await Promise.all([
    prisma.accountRequest.count({ where: expiring7.where }),
    prisma.accountRequest.count({ where: expiring1.where }),
    prisma.accountRequest.findMany({
      where: expiring7.where,
      select: {
        id: true,
        nombreApellidos: true,
        fechaExpiracion: true,
      },
      orderBy: { fechaExpiracion: "asc" },
      take: 20,
    }),
  ]);

  return (
    <div className="flex w-full flex-col gap-6">
      <div className="flex w-full items-center justify-between px-5 pt-5">
        <BackButton />
        <NotificationBell
          count7={count7}
          count1={count1}
          accounts={accounts.map((a) => ({
            ...a,
            fechaExpiracion: a.fechaExpiracion?.toISOString() ?? "",
          }))}
        />
      </div>
      {children}
    </div>
  );
}
