import { describe, expect, it, vi } from "vitest";

import type { AdSyncConfig } from "./config";
import type { AdEntry } from "./mapper";
import { mapAdUserEntry } from "./mapper";
import { syncAdDirectory } from "./sync";
import type { AdDomainUser } from "./types";

const baseConfig: AdSyncConfig = {
  url: "ldaps://dc.corp.local:636",
  bindDn: "CN=svc-report,CN=Users,DC=corp,DC=local",
  bindPassword: "secret",
  searchBase: "OU=Usuarios,DC=corp,DC=local",
  tlsInsecure: false,
};

type FakeEntry = Record<string, string | string[]>;

function entry(values: FakeEntry): AdEntry {
  return values;
}

describe("mapAdUserEntry", () => {
  it("mapea sAMAccountName, displayName, title y department por el atributo AD", () => {
    const user = mapAdUserEntry(
      entry({
        sAMAccountName: "j.perez",
        displayName: "José Pérez",
        title: "Operador",
        department: "Servicios",
        userAccountControl: "512",
      }),
    );

    expect(user).toEqual({
      username: "j.perez",
      fullName: "José Pérez",
      position: "Operador",
      area: "Servicios",
      active: true,
    });
  });

  it("sin displayName arma el nombre con givenName y sn", () => {
    const user = mapAdUserEntry(
      entry({
        sAMAccountName: "j.perez",
        givenName: "José",
        sn: "Pérez Domínguez",
        userAccountControl: "512",
      }),
    );

    expect(user?.fullName).toBe("José Pérez Domínguez");
  });

  it("una cuenta deshabilitada (bit 0x2 de userAccountControl) queda inactiva", () => {
    const user = mapAdUserEntry(
      entry({ sAMAccountName: "svc vieja", userAccountControl: "514" }),
    );

    expect(user?.active).toBe(false);
  });

  it("una entrada sin sAMAccountName no es un usuario navegable y se descarta", () => {
    expect(
      mapAdUserEntry(entry({ displayName: "Sólo decorativo" })),
    ).toBeNull();
  });

  it("una entrada sin nombre completo ni givenName/sn mantiene el username desde el log", () => {
    const user = mapAdUserEntry(
      entry({ sAMAccountName: "j.perez", userAccountControl: "512" }),
    );

    expect(user?.fullName).toBe("");
  });
});

describe("syncAdDirectory", () => {
  const users: AdDomainUser[] = [
    {
      username: "j.perez",
      fullName: "José Pérez",
      position: "Operador",
      area: "Servicios",
      active: true,
    },
    {
      username: "m.lopez",
      fullName: "María López",
      position: "Jefa de Área",
      area: "Servicios",
      active: false,
    },
  ];

  it("crea y deshabilita en un upsert con AD como autoritativo", async () => {
    const upsert = vi.fn().mockResolvedValue({});
    const prisma = {
      proxyAccount: { upsert, findMany: vi.fn().mockResolvedValue([]) },
    };

    const result = await syncAdDirectory(prisma as never, baseConfig, {
      searchUsers: () =>
        (async function* () {
          for (const user of users) yield user;
        })(),
    });

    expect(result).toEqual({ created: 2, updated: 0, deactivated: 0 });
    expect(upsert).toHaveBeenCalledTimes(2);
    expect(upsert).toHaveBeenCalledWith({
      where: { username: "j.perez" },
      create: {
        username: "j.perez",
        displayName: "José Pérez",
        position: "Operador",
        area: "Servicios",
        active: true,
      },
      update: {
        displayName: "José Pérez",
        position: "Operador",
        area: "Servicios",
        active: true,
      },
    });
    expect(upsert).toHaveBeenLastCalledWith(
      expect.objectContaining({
        where: { username: "m.lopez" },
        create: expect.objectContaining({ active: false }),
        update: expect.objectContaining({ active: false }),
      }),
    );
  });

  it("cuenta como actualización la cuenta que ya existía y como deshabilitada la que quedó inactiva", async () => {
    const upsert = vi.fn().mockResolvedValue({});
    const prisma = {
      proxyAccount: {
        upsert,
        findMany: vi
          .fn()
          .mockResolvedValue([{ username: "m.lopez", active: true }]),
      },
    };

    const result = await syncAdDirectory(prisma as never, baseConfig, {
      searchUsers: () =>
        (async function* () {
          for (const user of users) yield user;
        })(),
    });

    expect(result).toEqual({ created: 1, updated: 0, deactivated: 1 });
  });

  it("net-vacío no consulta la base y devuelve tres en cero", async () => {
    const prisma = { proxyAccount: { upsert: vi.fn(), findMany: vi.fn() } };

    const result = await syncAdDirectory(prisma as never, baseConfig, {
      searchUsers: () =>
        (async function* () {})(),
    });

    expect(result).toEqual({ created: 0, updated: 0, deactivated: 0 });
    expect(prisma.proxyAccount.findMany).not.toHaveBeenCalled();
  });
});
