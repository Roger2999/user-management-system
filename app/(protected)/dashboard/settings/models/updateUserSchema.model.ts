import z from "zod";

export const UpdateUserSchema = z.object({
  username: z
    .string()
    .min(3, "Mínimo de 3 caracteres")
    .max(20, "Máximo de 20 caracteres"),
  displayName: z
    .string()
    .max(40, "Máximo de 40 caracteres")
    .optional(),
  // Cargo del operador: aparece en sus firmas (etapas Revisado/Ejecutado).
  cargo: z
    .string()
    .trim()
    .max(100, "Máximo de 100 caracteres")
    .optional(),
});

export type UpdateUserFormValues = z.infer<typeof UpdateUserSchema>;