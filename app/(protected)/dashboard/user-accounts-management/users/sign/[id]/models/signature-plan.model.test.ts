import { describe, expect, it } from "vitest";
import { AccountRequestStage } from "@/generated/prisma/enums";
import {
  emptySignValues,
  planSignatures,
  resolveSignerFields,
  toSignData,
  type CorrectionEntry,
  type SignatureRow,
  type SignValues,
  type StageKey,
  type SubmittedSign,
} from "./signature-plan.model";

const NOW = new Date("2026-03-01T10:00:00.000Z");

const operator = {
  id: "user-1",
  name: "Ana Pérez",
  username: "aperez",
  position: "Especialista",
};

function submitted(checks: Partial<Record<StageKey, boolean>> = {}): SubmittedSign {
  return {
    id: "req-1",
    checks: {
      requested: checks.requested ?? false,
      revised: checks.revised ?? false,
      approved: checks.approved ?? false,
      executed: checks.executed ?? false,
    },
  };
}

function baseValues(overrides: Partial<SignValues> = {}): SignValues {
  return {
    ...emptySignValues(submitted()),
    ...overrides,
  };
}

function row(
  overrides: Partial<SignatureRow> & { stage: AccountRequestStage },
): SignatureRow {
  return {
    id: `sig-${overrides.stage}`,
    fullName: "Firmante Original",
    position: "Cargo Original",
    ...overrides,
  };
}

function readFrom(fields: Record<string, string>) {
  return (name: string): string | null => fields[name]?.trim() || null;
}

describe("resolveSignerFields", () => {
  it("toma la identidad de la sesión en la etapa propia e ignora el formulario", () => {
    const values = resolveSignerFields(
      submitted({ revised: true }),
      readFrom({
        revisedName: "Nombre escrito a mano",
        revisedPosition: "Cargo escrito a mano",
      }),
      [],
      operator,
    );

    expect(values.revisedName).toBe("Ana Pérez");
    expect(values.revisedPosition).toBe("Especialista");
  });

  it("respeta el texto libre del formulario en etapas externas", () => {
    const values = resolveSignerFields(
      submitted({ requested: true }),
      readFrom({ requestedName: "Director General", requestedPosition: "DG" }),
      [],
      operator,
    );

    expect(values.requestedName).toBe("Director General");
    expect(values.requestedPosition).toBe("DG");
  });

  it("reutiliza los valores persistidos cuando el campo no viaja en el formulario", () => {
    const values = resolveSignerFields(
      submitted({ requested: true }),
      readFrom({}),
      [row({ stage: "requested", fullName: "Firmante Original" })],
      operator,
    );

    expect(values.requestedName).toBe("Firmante Original");
    expect(values.requestedPosition).toBe("Cargo Original");
  });

  it("usa el username cuando la cuenta no tiene nombre visible", () => {
    const values = resolveSignerFields(submitted({ revised: true }), readFrom({}), [], {
      ...operator,
      name: "   ",
    });

    expect(values.revisedName).toBe("aperez");
  });
});

describe("planSignatures", () => {
  it("crea la firma de una etapa nueva con el reloj inyectado", () => {
    const values = baseValues({
      requested: true,
      requestedName: "Director General",
      requestedPosition: "DG",
    });

    const plan = planSignatures(values, [], operator, NOW);

    expect(plan.ok).toBe(true);
    if (!plan.ok) return;
    expect(plan.steps).toHaveLength(1);
    expect(plan.steps[0]).toMatchObject({
      kind: "create",
      stage: "requested",
      fullName: "Director General",
      position: "DG",
      signedAt: NOW,
    });
    expect(plan.signedStages).toEqual(["requested"]);
    expect(plan.corrections).toEqual([]);
  });

  it("rechaza revertir una firma ya registrada", () => {
    const plan = planSignatures(
      baseValues({ requested: false }),
      [row({ stage: "requested" })],
      operator,
      NOW,
    );

    expect(plan).toEqual({
      ok: false,
      message:
        "La firma de «Solicitado» ya está registrada y no se puede revertir.",
    });
  });

  it("exige que la etapa anterior esté firmada", () => {
    const plan = planSignatures(
      baseValues({
        approved: true,
        approvedName: "Directora",
        approvedPosition: "Directora General",
      }),
      [],
      operator,
      NOW,
    );

    expect(plan).toEqual({
      ok: false,
      message:
        "Para firmar «Aprobado» primero debe estar firmado «Revisado».",
    });
  });

  it("permite firmar cuando la etapa anterior ya está persistida", () => {
    const existing = [
      row({ stage: "requested", fullName: "Director", position: "DG" }),
      row({ stage: "revised", fullName: "Ana Pérez", position: "Especialista" }),
    ];

    const plan = planSignatures(
      baseValues({
        requested: true,
        requestedName: "Director",
        requestedPosition: "DG",
        revised: true,
        revisedName: "Ana Pérez",
        revisedPosition: "Especialista",
        approved: true,
        approvedName: "Directora",
        approvedPosition: "Directora General",
      }),
      existing,
      operator,
      NOW,
    );

    expect(plan.ok).toBe(true);
    if (!plan.ok) return;
    expect(plan.steps).toHaveLength(1);
    expect(plan.steps[0]).toMatchObject({ kind: "create", stage: "approved" });
  });

  it("registra la corrección de nombre de una firma existente", () => {
    const plan = planSignatures(
      baseValues({
        requested: true,
        requestedName: "Ana María",
        requestedPosition: "Cargo Original",
      }),
      [row({ stage: "requested", fullName: "Ana", position: "Cargo Original" })],
      operator,
      NOW,
    );

    expect(plan.ok).toBe(true);
    if (!plan.ok) return;
    expect(plan.steps).toHaveLength(1);
    expect(plan.steps[0]).toMatchObject({
      kind: "update",
      id: "sig-requested",
      fullName: "Ana María",
      correctionHistory: [
        {
          field: "name",
          previousValue: "Ana",
          newValue: "Ana María",
          editedByUser: "aperez",
          date: NOW.toISOString(),
        },
      ],
    });
    expect(plan.corrections).toEqual([
      {
        stage: "requested",
        field: "name",
        previousValue: "Ana",
        newValue: "Ana María",
      },
    ]);
  });

  it("acumula las correcciones sobre el historial previo", () => {
    const previous: CorrectionEntry = {
      field: "position",
      previousValue: "Cargo Viejo",
      newValue: "Cargo Original",
      editedByUser: "otro",
      date: "2026-01-01T00:00:00.000Z",
    };

    const plan = planSignatures(
      baseValues({
        requested: true,
        requestedName: "Firmante Original",
        requestedPosition: "Cargo Nuevo",
      }),
      [
        row({
          stage: "requested",
          fullName: "Firmante Original",
          position: "Cargo Original",
          correctionHistory: [previous],
        }),
      ],
      operator,
      NOW,
    );

    expect(plan.ok).toBe(true);
    if (!plan.ok) return;
    const step = plan.steps[0];
    expect(step.kind).toBe("update");
    if (step.kind !== "update") return;
    expect(step.correctionHistory).toHaveLength(2);
    expect(step.correctionHistory[0]).toEqual(previous);
  });

  it("no genera pasos cuando no hay cambios", () => {
    const plan = planSignatures(
      baseValues({
        requested: true,
        requestedName: "Firmante Original",
        requestedPosition: "Cargo Original",
      }),
      [row({ stage: "requested" })],
      operator,
      NOW,
    );

    expect(plan).toEqual({
      ok: true,
      steps: [],
      signedStages: [],
      corrections: [],
    });
  });
});

describe("toSignData", () => {
  it("devuelve sólo los campos del formulario, sin el id de la solicitud", () => {
    const data = toSignData(baseValues({ requested: true, revised: true }));

    expect(data).not.toHaveProperty("id");
    expect(Object.keys(data).sort()).toEqual([
      "approved",
      "approvedName",
      "approvedPosition",
      "executed",
      "executedName",
      "executedPosition",
      "requested",
      "requestedName",
      "requestedPosition",
      "revised",
      "revisedName",
      "revisedPosition",
    ]);
  });
});
