import { beforeEach, describe, expect, it, vi } from "vitest";

const h = vi.hoisted(() => {
  const state = {
    signatures: [] as {
      id: string;
      stage: string;
      fullName: string;
      position: string;
      correctionHistory: unknown;
    }[],
    requestExists: true,
    creates: [] as Record<string, unknown>[],
    updates: [] as Record<string, unknown>[],
    audits: [] as Record<string, unknown>[],
  };

  const prismaMock = {
    accountRequest: {
      findUnique: async () =>
        state.requestExists
          ? { id: "req-1", signatures: state.signatures }
          : null,
    },
    accountRequestSignature: {
      create: async ({ data }: { data: Record<string, unknown> }) => {
        state.creates.push(data);
        return data;
      },
      update: async ({
        where,
        data,
      }: {
        where: Record<string, unknown>;
        data: Record<string, unknown>;
      }) => {
        state.updates.push({ where, data });
        return data;
      },
    },
    auditLog: {
      create: async ({ data }: { data: Record<string, unknown> }) => {
        state.audits.push(data);
        return data;
      },
    },
    $transaction: vi.fn(async (operations: unknown) =>
      Array.isArray(operations) ? Promise.all(operations) : null,
    ),
  };

  return {
    state,
    prismaMock,
    sessionUser: {
      id: "user-1",
      name: "Ana Pérez",
      username: "aperez",
      position: "Especialista",
    },
  };
});

vi.mock("@/lib/prisma", () => ({ default: h.prismaMock }));
vi.mock("@/helpers/requireAdmin", () => ({ requireAdmin: async () => {} }));
vi.mock("@/helpers/getSession", () => ({
  getSession: async () => ({ user: h.sessionUser }),
}));
vi.mock("next/cache", () => ({ revalidatePath: () => {} }));

import { signAction } from "./sign-action";

function signedRow(
  stage: string,
  fullName = "Firmante Original",
  position = "Cargo Original",
) {
  return {
    id: `sig-${stage}`,
    stage,
    fullName,
    position,
    correctionHistory: null,
  };
}

async function submit(entries: Record<string, string>) {
  const formData = new FormData();
  for (const [key, value] of Object.entries(entries)) {
    formData.append(key, value);
  }

  return signAction(
    { data: null, success: false, dbErrors: null },
    formData,
  );
}

beforeEach(() => {
  h.state.signatures = [];
  h.state.requestExists = true;
  h.state.creates = [];
  h.state.updates = [];
  h.state.audits = [];
  h.prismaMock.$transaction.mockClear();
});

describe("signAction", () => {
  it("crea la firma y registra la auditoría en una sola transacción", async () => {
    const result = await submit({
      id: "req-1",
      requested: "on",
      requestedName: "Director General",
      requestedPosition: "DG",
    });

    expect(result.success).toBe(true);
    expect(h.state.creates).toHaveLength(1);
    expect(h.state.creates[0]).toMatchObject({
      accountRequestId: "req-1",
      stage: "requested",
      fullName: "Director General",
      position: "DG",
      registeredByUserId: "user-1",
      registeredByName: "Ana Pérez",
    });
    expect(h.state.audits).toHaveLength(1);
    expect(h.state.audits[0]).toMatchObject({
      action: "SIGN",
      entityType: "AccountRequest",
      entityId: "req-1",
      actorUserId: "user-1",
      metadata: {
        signedStages: ["requested"],
        corrections: [],
      },
    });
    expect(h.prismaMock.$transaction).toHaveBeenCalledTimes(1);
    const operations = h.prismaMock.$transaction.mock.calls[0][0];
    expect(operations).toHaveLength(2);
  });

  it("no escribe nada cuando se intenta revertir una firma", async () => {
    h.state.signatures = [signedRow("requested")];

    const result = await submit({ id: "req-1" });

    expect(result.success).toBe(false);
    expect(result.dbErrors?.message).toBe(
      "La firma de «Solicitado» ya está registrada y no se puede revertir.",
    );
    expect(h.state.creates).toEqual([]);
    expect(h.state.updates).toEqual([]);
    expect(h.state.audits).toEqual([]);
    expect(h.prismaMock.$transaction).not.toHaveBeenCalled();
  });

  it("devuelve los errores de validación por campo sin escribir", async () => {
    const result = await submit({
      id: "req-1",
      requested: "on",
      requestedPosition: "DG",
    });

    expect(result.success).toBe(false);
    expect(result.validationErrors?.requestedName).toEqual([
      "El nombre es obligatorio para firmar como «Solicitado».",
    ]);
    expect(h.state.creates).toEqual([]);
    expect(h.prismaMock.$transaction).not.toHaveBeenCalled();
  });

  it("informa cuando la solicitud no existe", async () => {
    h.state.requestExists = false;

    const result = await submit({ id: "req-1", requested: "on" });

    expect(result.success).toBe(false);
    expect(result.dbErrors?.message).toBe(
      "No se encontró la solicitud de cuenta.",
    );
    expect(h.state.creates).toEqual([]);
  });

  it("firma la etapa propia con la identidad de la sesión", async () => {
    h.state.signatures = [signedRow("requested", "Director", "DG")];

    const result = await submit({
      id: "req-1",
      requested: "on",
      requestedName: "Director",
      requestedPosition: "DG",
      revised: "on",
      revisedName: "Texto ignorado",
      revisedPosition: "Cargo ignorado",
    });

    expect(result.success).toBe(true);
    expect(h.state.creates[0]).toMatchObject({
      stage: "revised",
      fullName: "Ana Pérez",
      position: "Especialista",
    });
  });

  it("no devuelve el id de la solicitud al formulario", async () => {
    const result = await submit({
      id: "req-1",
      requested: "on",
      requestedName: "Director General",
      requestedPosition: "DG",
    });

    expect(result.data).not.toHaveProperty("id");
  });
});
