import z from "zod";

export const SIGN_STAGES = [
  { key: "requested", label: "Solicitado" },
  { key: "revised", label: "Revisado" },
  { key: "approved", label: "Aprobado" },
  { key: "executed", label: "Ejecutado" },
] as const;

export const SignFormSchema = z
  .object({
    id: z.string().min(1).max(100, "Máximo 100 caracteres"),
    requested: z.boolean().default(false),
    requestedName: z.string().max(100, "Máximo 100 caracteres").trim().optional(),
    requestedPosition: z
      .string()
      .max(100, "Máximo 100 caracteres")
      .trim()
      .optional(),
    revised: z.boolean().default(false),
    revisedName: z.string().max(100, "Máximo 100 caracteres").trim().optional(),
    revisedPosition: z
      .string()
      .max(100, "Máximo 100 caracteres")
      .trim()
      .optional(),
    approved: z.boolean().default(false),
    approvedName: z.string().max(100, "Máximo 100 caracteres").trim().optional(),
    approvedPosition: z
      .string()
      .max(100, "Máximo 100 caracteres")
      .trim()
      .optional(),
    executed: z.boolean().default(false),
    executedName: z.string().max(100, "Máximo 100 caracteres").trim().optional(),
    executedPosition: z
      .string()
      .max(100, "Máximo 100 caracteres")
      .trim()
      .optional(),
  })
  .superRefine((values, ctx) => {
    for (const { key, label } of SIGN_STAGES) {
      if (!values[key]) continue;
      const name = values[`${key}Name`]?.trim() ?? "";
      const position = values[`${key}Position`]?.trim() ?? "";
      if (!name) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [`${key}Name`],
          message: `El nombre es obligatorio para firmar como «${label}».`,
        });
      }
      if (!position) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [`${key}Position`],
          message: `El cargo es obligatorio para firmar como «${label}».`,
        });
      }
    }
  });

export type SignFormValues = z.infer<typeof SignFormSchema>;