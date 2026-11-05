import { describe, expect, it } from "vitest";
import z from "zod";
import { AccountRequestSchema } from "./account-request-schema.model";

const base = {
  requestType: "NEW",
  folio: "EE-CAR-016",
  fullName: "Ana Pérez",
  currentPosition: "Especialista",
  department: "Informática",
  staffType: "TECHNICIAN",
  username: "aperez",
  accountType: "PERMANENT",
  pcName: "PC-01",
  pcAssetTag: "INV-001",
};

function parse(overrides: Record<string, unknown> = {}) {
  return AccountRequestSchema.safeParse({ ...base, ...overrides });
}

function fieldErrors(overrides: Record<string, unknown> = {}) {
  const result = parse(overrides);
  if (result.success) return {};
  return z.flattenError(result.error).fieldErrors;
}

describe("AccountRequestSchema — cuenta de usuario", () => {
  it("acepta cuentaUsuario y actividadRealiza opcionales", () => {
    const result = parse({
      cuentaUsuario: "aperez.adm",
      actividadRealiza: "Soporte técnico a usuarios",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.cuentaUsuario).toBe("aperez.adm");
      expect(result.data.actividadRealiza).toBe("Soporte técnico a usuarios");
    }
  });

  it("administradorSistema vale false cuando no se envía", () => {
    const result = parse();

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.administradorSistema).toBe(false);
    }
  });

  it("administradorSistema conserva true cuando se envía", () => {
    const result = parse({ administradorSistema: true });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.administradorSistema).toBe(true);
    }
  });

  it("limita cuentaUsuario a 100 caracteres", () => {
    const errors = fieldErrors({ cuentaUsuario: "x".repeat(101) });

    expect(errors.cuentaUsuario).toEqual(["Máximo 100 caracteres"]);
  });

  it("limita actividadRealiza a 500 caracteres", () => {
    const errors = fieldErrors({ actividadRealiza: "x".repeat(501) });

    expect(errors.actividadRealiza).toEqual(["Máximo 500 caracteres"]);
  });
});
