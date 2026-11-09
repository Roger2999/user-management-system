import z from "zod";

export const ResetUserPasswordSchema = z
  .object({
    userId: z.string().min(1, "Debe seleccionar un usuario"),
    newPassword: z
      .string()
      .min(8, "Mínimo 8 caracteres")
      .max(128, "Máximo 128 caracteres"),
    confirmNewPassword: z
      .string()
      .min(8, "Mínimo 8 caracteres")
      .max(128, "Máximo 128 caracteres"),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: "Las contraseñas deben ser iguales",
    path: ["confirmNewPassword"],
  });

export type ResetUserPasswordFormValues = z.infer<
  typeof ResetUserPasswordSchema
>;
