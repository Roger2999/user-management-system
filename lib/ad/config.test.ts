import { describe, expect, it } from "vitest";

import { loadAdConfig } from "./config";

const VALID = {
  AD_URL: "ldaps://dc.corp.local:636",
  AD_BIND_DN: "CN=svc-report,CN=Users,DC=corp,DC=local",
  AD_BIND_PASSWORD: "secret",
  AD_USER_SEARCH_BASE: "OU=Usuarios,DC=corp,DC=local",
};

describe("loadAdConfig", () => {
  it("devuelve la configuración con una URL LDAPS completa", () => {
    const config = loadAdConfig({ ...VALID });

    expect(config).toEqual({
      url: "ldaps://dc.corp.local:636",
      bindDn: VALID.AD_BIND_DN,
      bindPassword: "secret",
      searchBase: VALID.AD_USER_SEARCH_BASE,
      tlsInsecure: false,
    });
  });

  it("recorta los espacios de los valores de entorno", () => {
    const config = loadAdConfig({
      ...VALID,
      AD_BIND_DN: `  ${VALID.AD_BIND_DN}  `,
    });

    expect(config?.bindDn).toBe(VALID.AD_BIND_DN);
  });

  it.each([
    ["AD_URL", "ldaps://dc.corp.local:636"],
    ["AD_BIND_DN", VALID.AD_BIND_DN],
    ["AD_BIND_PASSWORD", "secret"],
    ["AD_USER_SEARCH_BASE", VALID.AD_USER_SEARCH_BASE],
  ])("sin %s la sincronización queda no configurada", (variable, value) => {
    const env = { ...VALID, [variable]: undefined };
    expect(loadAdConfig(env)).toBeNull();
  });

  it("un valor solo de espacios cuenta como no configurado", () => {
    expect(loadAdConfig({ ...VALID, AD_BIND_PASSWORD: "   " })).toBeNull();
  });

  it.each([
    "ldap://dc.corp.local:389",
    "http://dc.corp.local:636",
    "dc.corp.local:636",
  ])("rechaza explícitamente la URL no LDAPS %s", (url) => {
    expect(() => loadAdConfig({ ...VALID, AD_URL: url })).toThrow(
      /ldaps:\/\//,
    );
  });

  it("AD_TLS_INSECURE=true habilita el escape de certificado autofirmado", () => {
    const config = loadAdConfig({ ...VALID, AD_TLS_INSECURE: "true" });

    expect(config?.tlsInsecure).toBe(true);
  });

  it("cualquier otro valor de AD_TLS_INSECURE mantiene la validación estricta", () => {
    const config = loadAdConfig({ ...VALID, AD_TLS_INSECURE: "1" });

    expect(config?.tlsInsecure).toBe(false);
  });
});
