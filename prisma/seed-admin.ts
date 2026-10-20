import "dotenv/config";
import { randomUUID } from "node:crypto";
import { hashPassword } from "better-auth/crypto";
import prisma from "@/lib/prisma";
import { UserRole } from "@/generated/prisma/enums";

/**
 * Crea el administrador inicial solo si la tabla `user` esta vacia.
 * No pisa usuarios existentes: es seguro correrlo en cada despliegue.
 */
async function main() {
  const userCount = await prisma.user.count();

  if (userCount > 0) {
    console.log(
      `Ya existen ${userCount} usuarios. No se crea el administrador inicial.`,
    );
    return;
  }

  const username = process.env.SEED_ADMIN_USERNAME?.trim() || "admin";
  const password = process.env.SEED_ADMIN_PASSWORD || "admin";
  const email = process.env.SEED_ADMIN_EMAIL?.trim() || "admin@localhost";
  const fullName =
    process.env.SEED_ADMIN_FULLNAME?.trim() || "Administrador";
  const position =
    process.env.SEED_ADMIN_POSITION?.trim() || "Administrador";

  const hashedPassword = await hashPassword(password);

  await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        id: randomUUID(),
        name: fullName,
        username,
        displayUsername: username,
        email,
        emailVerified: true,
        role: UserRole.ADMIN,
        fullName,
        position,
      },
    });

    await tx.account.create({
      data: {
        id: randomUUID(),
        accountId: user.id,
        providerId: "credential",
        userId: user.id,
        password: hashedPassword,
      },
    });
  });

  console.log(`Administrador inicial creado: «${username}».`);

  if (password === "admin") {
    console.warn(
      "AVISO: la contrasena es la de por defecto. Cambiala desde Configuracion.",
    );
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
