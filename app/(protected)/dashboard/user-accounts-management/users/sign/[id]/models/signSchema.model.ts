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
    requestedNombre: z.string().max(100, "Máximo 100 caracteres").trim().optional(),
    requestedCargo: z.string().max(100, "Máximo 100 caracteres").trim().optional(),
    revised: z.boolean().default(false),
    revisedNombre: z.string().max(100, "Máximo 100 caracteres").trim().optional(),
    revisedCargo: z.string().max(100, "Máximo 100 caracteres").trim().optional(),
    approved: z.boolean().default(false),
    approvedNombre: z.string().max(100, "Máximo 100 caracteres").trim().optional(),
    approvedCargo: z.string().max(100, "Máximo 100 caracteres").trim().optional(),
    executed: z.boolean().default(false),
    executedNombre: z.string().max(100, "Máximo 100 caracteres").trim().optional(),
    executedCargo: z.string().max(100, "Máximo 100 caracteres").trim().optional(),
  })
  .superRefine((values, ctx) => {
    for (const { key, label } of SIGN_STAGES) {
      if (!values[key]) continue;
      const nombre = values[`${key}Nombre`]?.trim() ?? "";
      const cargo = values[`${key}Cargo`]?.trim() ?? "";
      if (!nombre) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [`${key}Nombre`],
          message: `El nombre es obligatorio para firmar como «${label}».`,
        });
      }
      if (!cargo) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [`${key}Cargo`],
          message: `El cargo es obligatorio para firmar como «${label}».`,
        });
      }
    }
  });

export type SignFormValues = z.infer<typeof SignFormSchema>;