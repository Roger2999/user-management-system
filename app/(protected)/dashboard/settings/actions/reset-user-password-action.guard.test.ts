import { beforeEach, describe, expect, it, vi } from "vitest";

// Invariantes de seguridad de resetUserPasswordAction: la guarda real (sin
// mockear requireAdmin) corre antes de tocar la base, el hash guardado lo
// acepta el verificador de better-auth, y se revocan las sesiones del destino
// salvo la sesión propia en un self-reset.

const h = vi.hoisted(() => {
  type User = { id: string; username: string | null; fullName: string };
  type Account = {
    id: string;
    accountId: string;
    providerId: string;
    userId: string;
    password: string | null;
  };
  const state = {
    users: [] as User[],
    accounts: [] as Account[],
    sessions: [] as { id: string; userId: string }[],
    audits: [] as Record<string, unknown>[],
    calls: [] as string[],
    session: null as null | {
      user: { id: string; name: string; role: string };
      session: { id: string };
    },
  };

  const tx = {
    account: {
      findFirst: async (args: {
        where: { userId: string; providerId: string };
      }) => {
        state.calls.push("account.findFirst");
        return (
          state.accounts.find(
            (a) =>
              a.userId === args.where.userId &&
              a.providerId === args.where.providerId,
          ) ?? null
        );
      },
      update: async (args: {
        where: { id: string };
        data: { password: string };
      }) => {
        state.calls.push("account.update");
        const account = state.accounts.find((a) => a.id === args.where.id);
        if (!account) throw new Error("account not found");
        account.password = args.data.password;
        return account;
      },
      create: async (args: { data: Account }) => {
        state.calls.push("account.create");
        state.accounts.push({ ...args.data });
        return args.data;
      },
    },
    session: {
      deleteMany: async (args: {
        where: { userId: string; id?: { not: string } };
      }) => {
        state.calls.push("session.deleteMany");
        const before = state.sessions.length;
        const keep = args.where.id?.not;
        state.sessions = state.sessions.filter(
          (s) =>
            !(
              s.userId === args.where.userId &&
              (keep === undefined || s.id !== keep)
            ),
        );
        return { count: before - state.sessions.length };
      },
    },
    auditLog: {
      create: async (args: { data: Record<string, unknown> }) => {
        state.calls.push("auditLog.create");
        state.audits.push(args.data);
        return args.data;
      },
    },
  };

  const prisma = {
    user: {
      findUnique: async (args: { where: { id: string } }) => {
        state.calls.push("user.findUnique");
        return state.users.find((u) => u.id === args.where.id) ?? null;
      },
    },
    $transaction: async (cb: (client: typeof tx) => Promise<unknown>) => cb(tx),
  };

  return { state, prisma };
});

vi.mock("@/lib/prisma", () => ({ default: h.prisma }));
vi.mock("@/lib/getSession", () => ({
  getSession: async () => h.state.session,
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const { resetUserPasswordAction } = await import(
  "./reset-user-password-action"
);
const { verifyPassword } = await import("better-auth/crypto");

const initial = { success: false, dbErrors: null, validationErrors: null };

function form(fields: Record<string, string>) {
  const formData = new FormData();
  for (const [key, value] of Object.entries(fields)) formData.set(key, value);
  return formData;
}

function reset(userId: string, password: string, confirm = password) {
  return resetUserPasswordAction(
    initial,
    form({ userId, newPassword: password, confirmNewPassword: confirm }),
  );
}

const accountFor = (userId: string) =>
  h.state.accounts.find((a) => a.userId === userId)!;

function seed() {
  h.state.users = [
    { id: "admin-1", username: "admin", fullName: "Admin General" },
    { id: "user-2", username: "jdoe", fullName: "John Doe" },
  ];
  h.state.accounts = [
    {
      id: "acc-admin",
      accountId: "admin-1",
      providerId: "credential",
      userId: "admin-1",
      password: "old",
    },
    {
      id: "acc-user",
      accountId: "user-2",
      providerId: "credential",
      userId: "user-2",
      password: "old",
    },
  ];
  h.state.sessions = [
    { id: "s-admin", userId: "admin-1" },
    { id: "s-user-1", userId: "user-2" },
    { id: "s-user-2", userId: "user-2" },
  ];
  h.state.audits = [];
  h.state.calls = [];
  h.state.session = {
    user: { id: "admin-1", name: "Admin General", role: "ADMIN" },
    session: { id: "s-admin" },
  };
}

describe("resetUserPasswordAction: guarda ADMIN", () => {
  beforeEach(seed);

  it.each([
    [
      "rol USER",
      {
        user: { id: "user-2", name: "John Doe", role: "USER" },
        session: { id: "s-user-1" },
      },
    ],
    ["sin sesión", null],
  ])(
    "aborta con %s antes de cualquier consulta o escritura",
    async (_label, session) => {
      h.state.session = session as typeof h.state.session;

      await expect(reset("user-2", "newpass-123")).rejects.toMatchObject({
        digest: expect.stringContaining("NEXT_REDIRECT"),
      });

      expect(h.state.calls).toEqual([]);
      expect(h.state.accounts[0].password).toBe("old");
      expect(h.state.audits).toEqual([]);
    },
  );
});

describe("resetUserPasswordAction: validación", () => {
  beforeEach(seed);

  it("rechaza 7 caracteres sin tocar la base", async () => {
    const state = await reset("user-2", "1234567");

    expect(state.validationErrors?.newPassword).toEqual([
      "Mínimo 8 caracteres",
    ]);
    expect(h.state.calls).toEqual([]);
  });

  it("rechaza 129 caracteres sin tocar la base", async () => {
    const state = await reset("user-2", "a".repeat(129));

    expect(state.validationErrors?.newPassword).toEqual([
      "Máximo 128 caracteres",
    ]);
    expect(h.state.calls).toEqual([]);
  });

  it("rechaza confirmación distinta y usuario vacío sin tocar la base", async () => {
    const mismatch = await reset("user-2", "newpass-123", "newpass-124");
    expect(mismatch.validationErrors?.confirmNewPassword).toEqual([
      "Las contraseñas deben ser iguales",
    ]);

    const empty = await reset("", "newpass-123");
    expect(empty.validationErrors?.userId).toEqual(["Debe seleccionar un usuario"]);

    expect(h.state.calls).toEqual([]);
    expect(h.state.audits).toEqual([]);
  });

  it("acepta los límites 8 y 128 con un hash verificable", async () => {
    expect((await reset("user-2", "abcdefgh")).success).toBe(true);
    expect(
      await verifyPassword({
        hash: accountFor("user-2").password!,
        password: "abcdefgh",
      }),
    ).toBe(true);

    const max = "b".repeat(128);
    expect((await reset("user-2", max)).success).toBe(true);
    expect(
      await verifyPassword({
        hash: accountFor("user-2").password!,
        password: max,
      }),
    ).toBe(true);
  });
});

describe("resetUserPasswordAction: usuario inexistente", () => {
  beforeEach(seed);

  it("devuelve error y no escribe nada", async () => {
    const state = await reset("no-existe", "newpass-123");

    expect(state.success).toBe(false);
    expect(state.dbErrors?.message).toBe("El usuario seleccionado no existe");
    expect(h.state.calls).toEqual(["user.findUnique"]);
    expect(h.state.audits).toEqual([]);
  });
});

describe("resetUserPasswordAction: hash y sesiones", () => {
  beforeEach(seed);

  it("guarda un hash que better-auth verifica y revoca todas las sesiones del destino", async () => {
    const state = await reset("user-2", "newpass-123");

    expect(state.success).toBe(true);
    const account = accountFor("user-2");
    expect(account.password).not.toBe("newpass-123");
    expect(
      await verifyPassword({ hash: account.password!, password: "newpass-123" }),
    ).toBe(true);
    expect(
      await verifyPassword({ hash: account.password!, password: "otra-clave" }),
    ).toBe(false);

    expect(h.state.sessions.map((s) => s.id)).toEqual(["s-admin"]);
    expect(h.state.audits).toEqual([
      expect.objectContaining({
        action: "UPDATE",
        entityType: "User",
        entityId: "user-2",
        actorUserId: "admin-1",
        metadata: { event: "password-reset", resetBySelf: false },
      }),
    ]);
  });

  it("conserva la sesión propia y revoca las demás al restablecer la propia contraseña", async () => {
    h.state.sessions.push({ id: "s-admin-2", userId: "admin-1" });

    expect((await reset("admin-1", "newpass-123")).success).toBe(true);

    expect(
      h.state.sessions
        .filter((s) => s.userId === "admin-1")
        .map((s) => s.id),
    ).toEqual(["s-admin"]);
    expect(h.state.audits[0].metadata).toEqual({
      event: "password-reset",
      resetBySelf: true,
    });
  });

  it("una segunda llamada actualiza la misma cuenta y no crea otra", async () => {
    await reset("user-2", "first-pass-1");
    await reset("user-2", "second-pass-2");

    expect(h.state.accounts.filter((a) => a.userId === "user-2")).toHaveLength(
      1,
    );
    expect(
      h.state.calls.filter((c) => c === "account.create"),
    ).toHaveLength(0);

    const account = accountFor("user-2");
    expect(
      await verifyPassword({
        hash: account.password!,
        password: "second-pass-2",
      }),
    ).toBe(true);
    expect(
      await verifyPassword({
        hash: account.password!,
        password: "first-pass-1",
      }),
    ).toBe(false);
  });

  it("crea la cuenta de credenciales cuando el destino no tenía contraseña", async () => {
    h.state.accounts = h.state.accounts.filter((a) => a.userId !== "user-2");

    expect((await reset("user-2", "newpass-123")).success).toBe(true);

    const created = accountFor("user-2");
    expect(created).toMatchObject({
      providerId: "credential",
      accountId: "user-2",
    });
    expect(
      await verifyPassword({ hash: created.password!, password: "newpass-123" }),
    ).toBe(true);
  });
});
