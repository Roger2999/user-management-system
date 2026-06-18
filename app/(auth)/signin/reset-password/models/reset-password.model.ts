import z from "zod";

export const ResetPasswordSchema = z
  .object({
    currentPassword: z
      .string()
      .min(1, "Mínimo de 8 caracteres")
      .max(128, "No puede tener más de 128 caracteres"),
    newPassword: z
      .string()
      .min(8, "Minimo de 8 caracteres")
      .max(128, "No puede tener más de 128 caracteres"),
    confirmNewPassword: z
      .string()
      .min(8, "Minimo de 8 caracteres")
      .max(128, "No puede tener más de 128 caracteres"),
  })
  .refine((data) => data.newPassword == data.confirmNewPassword, {
    message: "Las contraseñas deben ser iguales",
    path: ["confirmNewPassword"],
  });
export type ResetPasswordFormValues = z.infer<typeof ResetPasswordSchema>;
