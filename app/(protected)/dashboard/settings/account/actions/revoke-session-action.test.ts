import { beforeEach, describe, expect, it, vi } from "vitest";

const h = vi.hoisted(() => {
  const state = {
    revokedTokens: [] as string[],
    revokeOtherCalls: 0,
    revalidated: [] as string[],
    failure: null as Error | null,
    noSession: false,
  };

  const failIfNeeded = () => {
    if (state.noSession) throw new Error("UNAUTHORIZED");
    if (state.failure) throw state.failure;
  };

  return { state, failIfNeeded };
});

vi.mock("@/lib/auth", () => ({
  auth: {
    api: {
      revokeSession: async (args: { body: { token: string } }) => {
        h.failIfNeeded();
        h.state.revokedTokens.push(args.body.token);
        return { status: true };
      },
      revokeOtherSessions: async () => {
        h.failIfNeeded();
        h.state.revokeOtherCalls += 1;
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

const { revokeSessionAction } = await import("./revoke-session-action");
const { revokeOtherSessionsAction } = await import(
  "./revoke-other-sessions-action"
);

function formWithToken(token?: string) {
  const formData = new FormData();
  if (token !== undefined) formData.set("token", token);
  return formData;
}

beforeEach(() => {
  h.state.revokedTokens = [];
  h.state.revokeOtherCalls = 0;
  h.state.revalidated = [];
  h.state.failure = null;
  h.state.noSession = false;
});

describe("revokeSessionAction", () => {
  it("no llama a better-auth sin token", async () => {
    const state = await revokeSessionAction(formWithToken(""));

    expect(state.success).toBe(false);
    expect(h.state.revokedTokens).toEqual([]);
    expect(h.state.revalidated).toEqual([]);
  });

  it("revoca el token indicado y revalida la página", async () => {
    const state = await revokeSessionAction(formWithToken("session-token-1"));

    expect(state).toEqual({ success: true, message: "Sesión cerrada" });
    expect(h.state.revokedTokens).toEqual(["session-token-1"]);
    expect(h.state.revalidated).toEqual(["/dashboard/settings/account"]);
  });

  it("informa el fallo sin propagar la excepción", async () => {
    h.state.failure = new Error("no autorizado");

    const state = await revokeSessionAction(formWithToken("session-token-1"));

    expect(state.success).toBe(false);
    expect(state.message).toBe(
      "No se pudo cerrar la sesión. Intenta de nuevo.",
    );
    expect(h.state.revalidated).toEqual([]);
  });
});

describe("revokeOtherSessionsAction", () => {
  it("cierra las demás sesiones y revalida la página", async () => {
    const state = await revokeOtherSessionsAction();

    expect(state).toEqual({
      success: true,
      message: "Se cerraron las demás sesiones",
    });
    expect(h.state.revokeOtherCalls).toBe(1);
    expect(h.state.revalidated).toEqual(["/dashboard/settings/account"]);
  });

  it("informa el fallo sin revalidar", async () => {
    h.state.noSession = true;

    const state = await revokeOtherSessionsAction();

    expect(state.success).toBe(false);
    expect(state.message).toBe(
      "No se pudieron cerrar las sesiones. Intenta de nuevo.",
    );
    expect(h.state.revalidated).toEqual([]);
  });
});
