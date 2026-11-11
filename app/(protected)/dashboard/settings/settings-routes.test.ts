import { beforeEach, describe, expect, it, vi } from "vitest";

type Role = "ADMIN" | "USER";

const h = vi.hoisted(() => ({
  state: {
    session: null as null | {
      user: {
        id: string;
        name: string;
        role: Role;
        fullName?: string;
        username?: string;
        email?: string;
        position?: string | null;
      };
      session: { id: string };
    },
    redirects: [] as string[],
    calls: [] as string[],
    pathname: "/dashboard/settings/account",
  },
}));

vi.mock("@/lib/getSession", () => ({ getSession: async () => h.state.session }));
vi.mock("@/lib/prisma", () => ({
  default: {
    user: {
      findMany: async () => {
        h.state.calls.push("prisma.user.findMany");
        return [{ id: "u-1", username: "jdoe", fullName: "John Doe" }];
      },
      findUnique: async () => {
        h.state.calls.push("prisma.user.findUnique");
        return null;
      },
    },
    $transaction: async () => {
      h.state.calls.push("prisma.$transaction");
      return null;
    },
  },
}));
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    h.state.redirects.push(url);
    const error = new Error("NEXT_REDIRECT");
    (error as { digest?: string }).digest = `NEXT_REDIRECT;replace;${url};307;`;
    throw error;
  },
  usePathname: () => h.state.pathname,
}));
vi.mock("next/headers", () => ({ headers: async () => new Headers() }));
vi.mock("@/lib/auth", () => ({
  auth: {
    api: {
      listSessions: async () => {
        h.state.calls.push("auth.api.listSessions");
        return [
          {
            id: "s-1",
            createdAt: new Date("2026-01-01T00:00:00Z"),
            updatedAt: new Date("2026-01-01T00:00:00Z"),
            expiresAt: new Date("2026-02-01T00:00:00Z"),
            ipAddress: "127.0.0.1",
            userAgent: "vitest",
          },
        ];
      },
    },
  },
}));
vi.mock("@/modules/ad/config", () => ({
  loadAdConfig: () => ({ url: "ldaps://dc" }),
}));

const { default: SettingsPage } = await import("./page");
const { default: SettingsLayout } = await import("./layout");
const { default: AccountPage } = await import("./account/page");
const { default: AdministrationLayout } = await import(
  "./administration/layout"
);
const { default: AdministrationPage } = await import(
  "./administration/page"
);
const { default: Breadcrumbs } = await import(
  "../components/breadcrumbs"
);
const { renderToStaticMarkup } = await import("react-dom/server");

function setSession(role: Role, id = "u-1") {
  h.state.session = {
    user: {
      id,
      name: "Test User",
      role,
      fullName: "Test User",
      username: "tuser",
      email: "t@example.com",
      position: null,
    },
    session: { id: "s-1" },
  };
}

const markup = (element: unknown) =>
  renderToStaticMarkup(element as Parameters<typeof renderToStaticMarkup>[0]);

beforeEach(() => {
  h.state.session = null;
  h.state.redirects = [];
  h.state.calls = [];
  h.state.pathname = "/dashboard/settings/account";
});

describe("S1: /dashboard/settings redirige a account", () => {
  it("redirige sin renderizar un hub", () => {
    expect(() => SettingsPage()).toThrow("NEXT_REDIRECT");
    expect(h.state.redirects).toEqual(["/dashboard/settings/account"]);
  });
});

describe("S4: frontera ADMIN en administration", () => {
  it("layout con rol USER redirige a /dashboard", async () => {
    setSession("USER");
    await expect(AdministrationLayout({ children: null })).rejects.toThrow(
      "NEXT_REDIRECT",
    );
    expect(h.state.redirects).toEqual(["/dashboard"]);
  });

  it("layout sin sesión redirige a /signin", async () => {
    await expect(AdministrationLayout({ children: null })).rejects.toThrow(
      "NEXT_REDIRECT",
    );
    expect(h.state.redirects).toEqual(["/signin"]);
  });

  it("página con rol USER redirige y NO ejecuta prisma.user.findMany", async () => {
    setSession("USER");
    await expect(AdministrationPage()).rejects.toThrow("NEXT_REDIRECT");
    expect(h.state.redirects).toEqual(["/dashboard"]);
    expect(h.state.calls).toEqual([]);
  });

  it("página sin sesión redirige y NO ejecuta prisma.user.findMany", async () => {
    await expect(AdministrationPage()).rejects.toThrow("NEXT_REDIRECT");
    expect(h.state.redirects).toEqual(["/signin"]);
    expect(h.state.calls).toEqual([]);
  });

  it("página con rol ADMIN ejecuta una sola consulta y muestra las tres tarjetas", async () => {
    setSession("ADMIN");
    const html = markup(await AdministrationPage());
    expect(h.state.redirects).toEqual([]);
    expect(h.state.calls).toEqual(["prisma.user.findMany"]);
    expect(html).toContain("Crear usuario");
    expect(html).toContain("Restablecer contraseña");
    expect(html).toContain("Directorio de cuentas");
  });
});

describe("S5: account no consulta Prisma", () => {
  it("solo lee sesión y listSessions", async () => {
    setSession("USER");
    const html = markup(await AccountPage());
    expect(h.state.calls).toEqual(["auth.api.listSessions"]);
    expect(html).toContain("Sesiones activas");
    expect(html).toContain("Mi cuenta");
    expect(html).toContain("Datos de la cuenta");
    expect(html).toContain("Cambiar contraseña");
  });

  it("tampoco consulta Prisma para un ADMIN", async () => {
    setSession("ADMIN");
    markup(await AccountPage());
    expect(h.state.calls).toEqual(["auth.api.listSessions"]);
  });
});

describe("S7: layout, selector y breadcrumbs", () => {
  it("H1 Configuración y ambos destinos para ADMIN", async () => {
    setSession("ADMIN");
    const html = markup(await SettingsLayout({ children: null }));
    expect(html).toContain("Configuración");
    expect(html).toContain("Mi cuenta");
    expect(html).toContain("Administración");
    expect(html).toContain('href="/dashboard/settings/account"');
    expect(html).toContain('href="/dashboard/settings/administration"');
  });

  it("para USER no expone el destino de administración", async () => {
    setSession("USER");
    const html = markup(await SettingsLayout({ children: null }));
    expect(html).toContain("Configuración");
    expect(html).not.toContain("/dashboard/settings/administration");
    expect(html).not.toContain(">Administración<");
  });

  it("breadcrumbs de account muestran Mi cuenta", () => {
    h.state.pathname = "/dashboard/settings/account";
    const html = markup(Breadcrumbs());
    expect(html).toContain("Mi cuenta");
    expect(html).not.toContain("Administración");
  });

  it("breadcrumbs de administration muestran Administración", () => {
    h.state.pathname = "/dashboard/settings/administration";
    const html = markup(Breadcrumbs());
    expect(html).toContain("Administración");
    expect(html).toContain("Configuración");
  });
});
