import "dotenv/config";
import prisma from "@/lib/prisma";

/**
 * Borra las solicitudes y sus firmas, conservando intactos los datos de
 * autenticacion (`user`, `session`, `account`, `verification`).
 *
 * Las firmas no se borran explicitamente: `AccountRequestSignature` declara
 * `onDelete: Cascade` sobre `accountRequestId`, asi que se van con la solicitud.
 */
async function main() {
  const authBefore = {
    users: await prisma.user.count(),
    sessions: await prisma.session.count(),
    accounts: await prisma.account.count(),
  };

  const signatures = await prisma.accountRequestSignature.count();
  const requests = await prisma.accountRequest.count();

  console.log(`Solicitudes: ${requests}`);
  console.log(`Firmas:      ${signatures}`);
  console.log(
    `Usuarios:    ${authBefore.users} | Sesiones: ${authBefore.sessions} | Cuentas: ${authBefore.accounts}`,
  );

  const { count } = await prisma.accountRequest.deleteMany();
  console.log(`\nSolicitudes borradas: ${count}`);

  const authAfter = {
    users: await prisma.user.count(),
    sessions: await prisma.session.count(),
    accounts: await prisma.account.count(),
  };

  console.log(`Firmas restantes:  ${await prisma.accountRequestSignature.count()}`);

  const intact =
    authBefore.users === authAfter.users &&
    authBefore.sessions === authAfter.sessions &&
    authBefore.accounts === authAfter.accounts;

  console.log(
    `Autenticacion ${intact ? "intacta" : "ALTERADA"}: ` +
      `${authAfter.users} usuarios | ${authAfter.sessions} sesiones | ${authAfter.accounts} cuentas`,
  );

  if (!intact) {
    console.error("La autenticacion cambio. Revisar de inmediato.");
    process.exit(1);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
