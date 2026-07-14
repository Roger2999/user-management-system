import z from "zod";

export const SignupFormSchema = z
  .object({
    username: z
      .string()
      .min(3, "Mínimo de 3 caracteres")
      .max(20, "Máximo de 20 caracteres"),
    email: z.email("Correo inválido").min(1, "Campo obligatorio"),
    password: z
      .string()
      .min(8, "Mínimo de 8 caracteres")
      .max(128, "No puede tener más de 128 caracteres"),
    confirmPassword: z
      .string()
      .min(8, "Mínimo de 8 caracteres")
      .max(128, "No puede tener más de 128 caracteres"),
  })
  .refine((data) => data.password == data.confirmPassword, {
    message: "Las contraseñas deben ser iguales",
    path: ["confirmPassword"],
  });
export type SignupFormValues = z.infer<typeof SignupFormSchema>;
