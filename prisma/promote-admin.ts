import "dotenv/config";
import prisma from "@/lib/prisma";
import { UserRole } from "@/generated/prisma/enums";

async function main() {
  const username = process.argv[2];

  if (!username) {
    console.error("Uso: pnpm dlx tsx prisma/promote-admin.ts <username>");
    process.exit(1);
  }

  const user = await prisma.user.findUnique({ where: { username } });

  if (!user) {
    console.error(`No existe un usuario con username «${username}».`);
    process.exit(1);
  }

  if (user.role === UserRole.ADMIN) {
    console.log(`El usuario «${username}» ya es administrador.`);
    return;
  }

  await prisma.user.update({
    where: { username },
    data: { role: UserRole.ADMIN },
  });

  console.log(`Usuario «${username}» promovido a ADMIN.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());