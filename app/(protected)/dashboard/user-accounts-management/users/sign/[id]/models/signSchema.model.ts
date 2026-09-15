import z from "zod";

export const SIGN_STAGES = [
  { key: "requested", label: "Solicitado" },
  { key: "revised", label: "Revisado" },
  { key: "approved", label: "Aprobado" },
  { key: "executed", label: "Ejecutado" },
] as const;

export const SignFormSchema = z
  .object({
    id: z.string().min(1),
    requested: z.boolean().default(false),
    requestedNombre: z.string().trim().optional(),
    requestedCargo: z.string().trim().optional(),
    revised: z.boolean().default(false),
    revisedNombre: z.string().trim().optional(),
    revisedCargo: z.string().trim().optional(),
    approved: z.boolean().default(false),
    approvedNombre: z.string().trim().optional(),
    approvedCargo: z.string().trim().optional(),
    executed: z.boolean().default(false),
    executedNombre: z.string().trim().optional(),
    executedCargo: z.string().trim().optional(),
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