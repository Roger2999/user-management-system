import { getSession } from "@/helpers/getSession";
import { redirect } from "next/navigation";
import BackButton from "./components/back-button";
import NotificationBell from "./components/notification-bell";
import prisma from "@/lib/prisma";
import {
  expiringIn1Count,
  expiringIn7Count,
} from "./services/getAccountsCount.service";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getSession();
  if (!session) {
    redirect("/signin");
  }

  const [accounts] = await Promise.all([
    prisma.accountRequest.findMany({
      where: {
        tipoCuenta: "TEMPORAL",
        fechaExpiracion: {
          gte: new Date(),
          lte: new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000),
        },
      },
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
          count7={expiringIn7Count}
          count1={expiringIn1Count}
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
