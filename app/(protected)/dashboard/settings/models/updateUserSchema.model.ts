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
  // Obligatorio: la columna `charge` es NOT NULL desde la migración
  // 20260925225235_rename_user_cargo_to_charge. El `.trim()` va antes del
  // `.min()` para que un campo con solo espacios también se rechace.
  charge: z
    .string()
    .trim()
    .min(1, "El cargo es obligatorio")
    .max(100, "Máximo de 100 caracteres"),
});

export type UpdateUserFormValues = z.infer<typeof UpdateUserSchema>;