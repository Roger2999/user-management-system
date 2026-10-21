import { describe, expect, it } from "vitest";
import { getFilterConfig } from "./filters";

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

describe("getFilterConfig", () => {
  it("devuelve el filtro global para 'all'", () => {
    expect(getFilterConfig("all").where).toEqual({});
  });

  it("cae al filtro global cuando el valor no existe", () => {
    expect(getFilterConfig("no-existe").where).toEqual({});
  });

  it("filtra por tipo de solicitud", () => {
    expect(getFilterConfig("new").where).toEqual({ requestType: "NEW" });
    expect(getFilterConfig("update").where).toEqual({ requestType: "UPDATE" });
    expect(getFilterConfig("deprovisioning").where).toEqual({
      requestType: "DEPROVISIONING",
    });
  });

  it("filtra por tipo de cuenta", () => {
    expect(getFilterConfig("permanent").where).toEqual({
      accountType: "PERMANENT",
    });
    expect(getFilterConfig("temporary").where).toEqual({
      accountType: "TEMPORARY",
    });
  });

  it("considera pendiente cualquier etapa sin firmar", () => {
    expect(getFilterConfig("pendingSignature").where).toEqual({
      OR: [
        { signatures: { none: { stage: "requested" } } },
        { signatures: { none: { stage: "revised" } } },
        { signatures: { none: { stage: "approved" } } },
        { signatures: { none: { stage: "executed" } } },
      ],
    });
  });

  it("filtra las cuentas temporales ya expiradas", () => {
    const { where } = getFilterConfig("expired");
    const expiresAt = where.expiresAt as { lte: Date };

    expect(where.accountType).toBe("TEMPORARY");
    expect(expiresAt.lte).toBeInstanceOf(Date);
    expect(expiresAt.lte.getTime()).toBeLessThanOrEqual(Date.now());
  });

  it("filtra las cuentas que expiran dentro de 7 días", () => {
    const { where } = getFilterConfig("expiredIn7");
    const expiresAt = where.expiresAt as { gte: Date; lte: Date };

    expect(where.accountType).toBe("TEMPORARY");
    expect(expiresAt.lte.getTime() - expiresAt.gte.getTime()).toBe(
      7 * ONE_DAY_MS,
    );
  });

  it("filtra las cuentas que expiran dentro de 1 día", () => {
    const { where } = getFilterConfig("expiredIn1");
    const expiresAt = where.expiresAt as { gte: Date; lte: Date };

    expect(expiresAt.lte.getTime() - expiresAt.gte.getTime()).toBe(ONE_DAY_MS);
  });
});
