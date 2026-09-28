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
  // Operator position: shown in their signatures (Revised/Executed stages).
  // Required: the `position` column is NOT NULL. The `.trim()` runs before
  // `.min()` so a field with only spaces is also rejected.
  position: z
    .string()
    .trim()
    .min(1, "El cargo es obligatorio")
    .max(100, "Máximo de 100 caracteres"),
});

export type UpdateUserFormValues = z.infer<typeof UpdateUserSchema>;