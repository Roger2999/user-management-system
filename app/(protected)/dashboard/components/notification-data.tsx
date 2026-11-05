import { cache } from "react";
import prisma from "@/lib/prisma";
import { expiringWithin } from "@/modules/accounts/queries";
import NotificationBell from "./notification-bell";

const getExpiringAccounts = cache(async () => {
  const now = new Date();
  const in7Days = expiringWithin(now, 7);
  const in1Day = expiringWithin(now, 1);

  const [count7, count1, accounts] = await Promise.all([
    prisma.accountRequest.count({ where: in7Days }),
    prisma.accountRequest.count({ where: in1Day }),
    prisma.accountRequest.findMany({
      where: in7Days,
      select: {
        id: true,
        fullName: true,
        expiresAt: true,
      },
      orderBy: { expiresAt: "asc" },
      take: 20,
    }),
  ]);

  return {
    count7,
    count1,
    accounts: accounts.map((a) => ({
      ...a,
      expiresAt: a.expiresAt?.toISOString() ?? "",
    })),
  };
});

export default async function NotificationData() {
  const { count7, count1, accounts } = await getExpiringAccounts();
  return (
    <NotificationBell count7={count7} count1={count1} accounts={accounts} />
  );
}
