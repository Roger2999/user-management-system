import { beforeEach, describe, expect, it, vi } from "vitest";

const h = vi.hoisted(() => {
  const state = {
    calls: [] as { currentPassword: string; newPassword: string }[],
    failure: null as Error | null,
    revalidated: [] as string[],
  };

  return { state };
});

vi.mock("@/lib/auth", () => ({
  auth: {
    api: {
      changePassword: async (args: {
        body: { currentPassword: string; newPassword: string };
      }) => {
        if (h.state.failure) throw h.state.failure;
        h.state.calls.push(args.body);
        return { status: true };
      },
    },
  },
}));

vi.mock("next/headers", () => ({
  headers: async () => new Headers(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: (path: string) => {
    h.state.revalidated.push(path);
  },
}));

const { changePasswordAction } = await import("./change-password-action");

const initialState = {
  message: undefined,
  success: false,
  dbErrors: null,
  validationErrors: null,
};

function submit(fields: Record<string, string>) {
  const formData = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    formData.set(key, value);
  }
  return changePasswordAction(initialState, formData);
}

beforeEach(() => {
  h.state.calls = [];
  h.state.failure = null;
  h.state.revalidated = [];
});

describe("changePasswordAction", () => {
  it("rechaza contraseñas que no coinciden sin llamar a better-auth", async () => {
    const state = await submit({
      currentPassword: "clave-actual-1",
      newPassword: "clave-nueva-1",
      confirmNewPassword: "clave-nueva-2",
    });

    expect(state.success).toBe(false);
    expect(state.validationErrors?.confirmNewPassword).toEqual([
      "Las contraseñas deben ser iguales",
    ]);
    expect(h.state.calls).toEqual([]);
  });

  it("rechaza una contraseña nueva demasiado corta", async () => {
    const state = await submit({
      currentPassword: "clave-actual-1",
      newPassword: "corta",
      confirmNewPassword: "corta",
    });

    expect(state.validationErrors?.newPassword).toEqual([
      "Mínimo 8 caracteres",
    ]);
    expect(h.state.calls).toEqual([]);
  });

  it("cambia la contraseña y revalida la página", async () => {
    const state = await submit({
      currentPassword: "clave-actual-1",
      newPassword: "clave-nueva-1",
      confirmNewPassword: "clave-nueva-1",
    });

    expect(state.success).toBe(true);
    expect(state.message).toBe("Contraseña actualizada con éxito");
    expect(h.state.calls).toEqual([
      { currentPassword: "clave-actual-1", newPassword: "clave-nueva-1" },
    ]);
    expect(h.state.revalidated).toEqual(["/dashboard/settings/account"]);
  });

  it("informa el fallo de better-auth sin propagar la excepción", async () => {
    h.state.failure = new Error("invalid password");

    const state = await submit({
      currentPassword: "clave-actual-1",
      newPassword: "clave-nueva-1",
      confirmNewPassword: "clave-nueva-1",
    });

    expect(state.success).toBe(false);
    expect(state.dbErrors?.message).toBe("Error inesperado");
    expect(h.state.revalidated).toEqual([]);
  });
});
