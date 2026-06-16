import z from "zod";

export const SignupFormSchema = z
  .object({
    username: z
      .string()
      .min(3, "Minimo de 3 caracteres")
      .max(20, "Maximo de 20 caracteres"),
    email: z.email("Email inválido").min(1, "Campo obligatorio"),
    password: z
      .string()
      .min(8, "Minimo de 8 caracteres")
      .max(128, "No puede tener mas de 128 caracteres"),
    confirmPassword: z
      .string()
      .min(8, "Minimo de 8 caracteres")
      .max(128, "No puede tener mas de 128 caracteres"),
  })
  .refine((data) => data.password == data.confirmPassword, {
    message: "Las contraseñas deben ser iguales",
    path: ["confirmPassword"],
  });
export type SignupFormValues = z.infer<typeof SignupFormSchema>;
