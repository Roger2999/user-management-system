import type { AdSyncConfig } from "./config";
import type { PrismaClient } from "@/lib/db";
import { searchAdUsers } from "./client";
import type { AdDomainUser, AdSyncResult } from "./types";

/**
 * Upsert idempotente de `ProxyAccount` con lo que dice el Active Directory (S4).
 *
 * El dominio es **autoritativo** para `displayName`, `position`, `area` y
 * `active`: cada corrida pisa esos campos. No borra cuentas ni toca lo que el
 * log aporta (`username` es la clave; los hallazgos ya relacionan con esa
 * cuenta). El `username` del log y el `sAMAccountName` son la misma cadena
 * porque Squid autentica contra el dominio.
 *
 * Las cuentas y su conteo exigen leer el estado previo: "creada" es la cuenta
 * que no existía, "deshabilitada" la que existía activa y llega inactiva del
 * dominio, y "actualizada" toda la demás que existía.
 */

export type SearchAdUsers = (
  config: AdSyncConfig,
) => AsyncIterable<AdDomainUser>;

export type SyncDependencies = {
  searchUsers?: SearchAdUsers;
};

export async function syncAdDirectory(
  prisma: PrismaClient,
  config: AdSyncConfig,
  dependencies: SyncDependencies = {},
): Promise<AdSyncResult> {
  const searchUsers = dependencies.searchUsers ?? searchAdUsers;

  const users: AdDomainUser[] = [];
  for await (const user of searchUsers(config)) {
    users.push(user);
  }

  const usernames = users.map((user) => user.username);
  const existing =
    usernames.length === 0
      ? []
      : await prisma.proxyAccount.findMany({
          where: { username: { in: usernames } },
          select: { username: true, active: true },
        });

  const priorActive = new Map(existing.map((row) => [row.username, row.active]));

  const result: AdSyncResult = { created: 0, updated: 0, deactivated: 0 };

  for (const user of users) {
    const wasActive = priorActive.get(user.username);

    if (wasActive === undefined) {
      result.created += 1;
    } else if (user.active) {
      result.updated += 1;
    } else {
      result.deactivated += 1;
    }

    await prisma.proxyAccount.upsert({
      where: { username: user.username },
      create: {
        username: user.username,
        displayName: user.fullName,
        position: user.position,
        area: user.area,
        active: user.active,
      },
      update: {
        displayName: user.fullName,
        position: user.position,
        area: user.area,
        active: user.active,
      },
    });
  }

  return result;
}
