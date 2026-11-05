import { describe, expect, it } from "vitest";
import { getFilterConfig, isFilterValue } from "./filters";

const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const NOW = new Date("2026-01-15T12:00:00.000Z");

describe("isFilterValue", () => {
  it("acepta los valores del catálogo", () => {
    expect(isFilterValue("all")).toBe(true);
    expect(isFilterValue("expiredIn7")).toBe(true);
  });

  it("rechaza valores desconocidos", () => {
    expect(isFilterValue("no-existe")).toBe(false);
    expect(isFilterValue("")).toBe(false);
  });
});

describe("getFilterConfig", () => {
  it("devuelve el filtro global para 'all'", () => {
    expect(getFilterConfig("all").where).toEqual({});
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
    const { where } = getFilterConfig("expired", NOW);
    const expiresAt = where.expiresAt as { lte: Date };

    expect(where.accountType).toBe("TEMPORARY");
    expect(expiresAt.lte).toEqual(NOW);
  });

  it("filtra las cuentas que expiran dentro de 7 días", () => {
    const { where } = getFilterConfig("expiredIn7", NOW);
    const expiresAt = where.expiresAt as { gte: Date; lte: Date };

    expect(where.accountType).toBe("TEMPORARY");
    expect(expiresAt.gte).toEqual(NOW);
    expect(expiresAt.lte.getTime() - expiresAt.gte.getTime()).toBe(
      7 * ONE_DAY_MS,
    );
  });

  it("filtra las cuentas que expiran dentro de 1 día", () => {
    const { where } = getFilterConfig("expiredIn1", NOW);
    const expiresAt = where.expiresAt as { gte: Date; lte: Date };

    expect(where.accountType).toBe("TEMPORARY");
    expect(expiresAt.gte).toEqual(NOW);
    expect(expiresAt.lte.getTime() - expiresAt.gte.getTime()).toBe(ONE_DAY_MS);
  });
});
