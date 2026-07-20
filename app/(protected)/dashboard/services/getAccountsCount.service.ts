import { filtersByAccountType, filtersByRequestType } from "@/lib/filters";
import prisma from "@/lib/prisma";

export const [
  allUsersCount,
  usersRequesTypeCount,
  usersAccountTypeCount,
  usersPendingSignatureCount,
  expiredAccountsCount,
  expiringIn7Count,
  expiringIn1Count,
] = await Promise.all([
  prisma.accountRequest.count(),
  Promise.all(
    filtersByRequestType.map((f) =>
      prisma.accountRequest.count({ where: f.where }),
    ),
  ),
  Promise.all(
    filtersByAccountType.map((f) =>
      prisma.accountRequest.count({ where: f.where }),
    ),
  ),
  prisma.accountRequest.count({
    where: {
      OR: [
        { firmadoPorAprobado: false },
        { firmadoPorEjecutado: false },
        { firmadoPorRevisado: false },
        { firmadoPorSolicitado: false },
      ],
    },
  }),
  prisma.accountRequest.count({
    where: {
      tipoCuenta: "TEMPORAL",
      fechaExpiracion: { lt: new Date() },
    },
  }),
  prisma.accountRequest.count({
    where: {
      tipoCuenta: "TEMPORAL",
      fechaExpiracion: {
        gte: new Date(),
        lte: new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000),
      },
    },
  }),
  prisma.accountRequest.count({
    where: {
      tipoCuenta: "TEMPORAL",
      fechaExpiracion: {
        gte: new Date(),
        lte: new Date(new Date().getTime() + 24 * 60 * 60 * 1000),
      },
    },
  }),
]);
