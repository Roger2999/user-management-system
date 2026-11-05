import { beforeEach, describe, expect, it, vi } from "vitest";

const h = vi.hoisted(() => {
  const state = {
    guardError: null as Error | null,
    existingUsername: null as { id: string } | null,
    existingEmail: null as { id: string } | null,
    users: [] as Record<string, unknown>[],
    accounts: [] as Record<string, unknown>[],
    findFirstCalls: 0,
    transactionCalls: 0,
    transactionError: null as Error | null,
  };

  const tx = {
    user: {
      create: async (args: { data: Record<string, unknown> }) => {
        state.users.push(args.data);
        return { ...args.data, id: "user-new" };
      },
    },
    account: {
      create: async (args: { data: Record<string, unknown> }) => {
        state.accounts.push(args.data);
        return args.data;
      },
    },
  };

  const prismaMock = {
    user: {
      findFirst: async (args: { where: Record<string, unknown> }) => {
        state.findFirstCalls += 1;
        return "username" in args.where
          ? state.existingUsername
          : state.existingEmail;
      },
    },
    $transaction: async (
      callback: (client: typeof tx) => Promise<unknown>,
    ) => {
      state.transactionCalls += 1;
      if (state.transactionError) throw state.transactionError;
      return callback(tx);
    },
  };

  return { state, prismaMock };
});

vi.mock("@/lib/prisma", () => ({ default: h.prismaMock }));

vi.mock("@/helpers/requireAdmin", () => ({
  requireAdmin: async () => {
    if (h.state.guardError) throw h.state.guardError;
  },
}));

vi.mock("better-auth/crypto", () => ({
  hashPassword: async (password: string) => `hashed:${password}`,
}));

const { createUserAction } = await import("./create-user-action");

const initialState = {
  data: undefined,
  success: false,
  message: undefined,
  dbErrors: null,
  validationErrors: null,
};

const validPayload = {
  fullName: "Ana Pérez",
  username: "aperez",
  email: "ana@example.com",
  position: "Especialista",
  role: "USER",
  password: "clave-segura-1",
};

function submit(fields: Record<string, string>) {
  const formData = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    formData.set(key, value);
  }
  return createUserAction(initialState, formData);
}

beforeEach(() => {
  h.state.guardError = null;
  h.state.existingUsername = null;
  h.state.existingEmail = null;
  h.state.users = [];
  h.state.accounts = [];
  h.state.findFirstCalls = 0;
  h.state.transactionCalls = 0;
  h.state.transactionError = null;
});

describe("createUserAction", () => {
  it("no escribe nada si la guarda de administrador falla", async () => {
    h.state.guardError = new Error("not-admin");

    await expect(submit(validPayload)).rejects.toThrow("not-admin");

    expect(h.state.findFirstCalls).toBe(0);
    expect(h.state.transactionCalls).toBe(0);
    expect(h.state.users).toEqual([]);
  });

  it("rechaza un payload inválido sin consultar la base", async () => {
    const state = await submit({
      ...validPayload,
      username: "ab",
      email: "no-es-un-email",
      password: "123",
    });

    expect(state.success).toBe(false);
    expect(state.validationErrors?.username).toEqual(["Mínimo 3 caracteres"]);
    expect(state.validationErrors?.email).toEqual(["Correo inválido"]);
    expect(state.validationErrors?.password).toEqual(["Mínimo 8 caracteres"]);
    expect(h.state.findFirstCalls).toBe(0);
    expect(h.state.transactionCalls).toBe(0);
  });

  it("rechaza username y email duplicados sin crear nada", async () => {
    h.state.existingUsername = { id: "user-1" };
    h.state.existingEmail = { id: "user-1" };

    const state = await submit(validPayload);

    expect(state.success).toBe(false);
    expect(state.validationErrors?.username).toEqual([
      "Este nombre de usuario ya existe",
    ]);
    expect(state.validationErrors?.email).toEqual(["Este email ya existe"]);
    expect(h.state.transactionCalls).toBe(0);
    expect(h.state.users).toEqual([]);
  });

  it("crea el usuario y su cuenta de credenciales con la contraseña hasheada", async () => {
    const state = await submit(validPayload);

    expect(state.success).toBe(true);
    expect(state.message).toBe("Usuario «aperez» creado con éxito");
    expect(h.state.transactionCalls).toBe(1);

    expect(h.state.users).toEqual([
      expect.objectContaining({
        name: "Ana Pérez",
        username: "aperez",
        email: "ana@example.com",
        role: "USER",
        emailVerified: true,
      }),
    ]);
    expect(h.state.accounts).toEqual([
      expect.objectContaining({
        providerId: "credential",
        userId: "user-new",
        password: "hashed:clave-segura-1",
      }),
    ]);
  });

  it("informa el fallo sin propagar la excepción de la transacción", async () => {
    h.state.transactionError = new Error("db down");

    const state = await submit(validPayload);

    expect(state.success).toBe(false);
    expect(state.dbErrors?.message).toBe(
      "Error al crear el usuario. Intenta de nuevo.",
    );
    expect(state.data).toEqual(validPayload);
  });
});
