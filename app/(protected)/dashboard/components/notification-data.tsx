import { cache } from "react";
import prisma from "@/lib/prisma";
import NotificationBell from "./notification-bell";

const getExpiringAccounts = cache(async () => {
  const now = new Date();
  const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const in1Day = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  const whereBase = {
    tipoCuenta: "TEMPORAL" as const,
    fechaExpiracion: { gte: now },
  };

  const [count7, count1, accounts] = await Promise.all([
    prisma.accountRequest.count({
      where: { ...whereBase, fechaExpiracion: { gte: now, lte: in7Days } },
    }),
    prisma.accountRequest.count({
      where: { ...whereBase, fechaExpiracion: { gte: now, lte: in1Day } },
    }),
    prisma.accountRequest.findMany({
      where: { ...whereBase, fechaExpiracion: { gte: now, lte: in7Days } },
      select: {
        id: true,
        nombreApellidos: true,
        fechaExpiracion: true,
      },
      orderBy: { fechaExpiracion: "asc" },
      take: 20,
    }),
  ]);

  return {
    count7,
    count1,
    accounts: accounts.map((a) => ({
      ...a,
      fechaExpiracion: a.fechaExpiracion?.toISOString() ?? "",
    })),
  };
});

export default async function NotificationData() {
  const { count7, count1, accounts } = await getExpiringAccounts();
  return (
    <NotificationBell count7={count7} count1={count1} accounts={accounts} />
  );
}
