import { describe, expect, it } from "vitest";
import z from "zod";
import { SignFormSchema, SIGN_STAGES } from "./signSchema.model";

function parse(input: Record<string, unknown>) {
  return SignFormSchema.safeParse({ id: "req-1", ...input });
}

function fieldErrors(input: Record<string, unknown>) {
  const result = parse(input);
  if (result.success) return {};
  return z.flattenError(result.error).fieldErrors;
}

describe("SignFormSchema", () => {
  it("exige nombre y cargo para la etapa que se firma", () => {
    const errors = fieldErrors({
      requested: true,
      requestedName: "",
      requestedPosition: "   ",
    });

    expect(errors.requestedName).toEqual([
      "El nombre es obligatorio para firmar como «Solicitado».",
    ]);
    expect(errors.requestedPosition).toEqual([
      "El cargo es obligatorio para firmar como «Solicitado».",
    ]);
  });

  it("no exige datos en las etapas que no se firman", () => {
    expect(parse({ requested: false })).toMatchObject({ success: true });
  });

  it("acepta las cuatro etapas completas", () => {
    const input = Object.fromEntries(
      SIGN_STAGES.flatMap(({ key }) => [
        [key, true],
        [`${key}Name`, "Firmante"],
        [`${key}Position`, "Cargo"],
      ]),
    );

    expect(parse(input)).toMatchObject({ success: true });
  });

  it("recorta los espacios de los valores firmados", () => {
    const result = parse({
      requested: true,
      requestedName: "  Director General  ",
      requestedPosition: "  DG  ",
    });

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.requestedName).toBe("Director General");
    expect(result.data.requestedPosition).toBe("DG");
  });

  it("rechaza valores de más de 100 caracteres", () => {
    const errors = fieldErrors({
      requested: true,
      requestedName: "a".repeat(101),
      requestedPosition: "DG",
    });

    expect(errors.requestedName).toEqual(["Máximo 100 caracteres"]);
  });

  it("rechaza un id vacío", () => {
    const result = SignFormSchema.safeParse({
      id: "",
      requested: false,
    });

    expect(result.success).toBe(false);
  });
});
