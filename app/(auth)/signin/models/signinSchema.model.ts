import z from "zod";

export const SigninFormSchema = z.object({
  email: z.email("Email inválido").min(1, "Campo requerido"),
  password: z
    .string()
    .min(8, "Mínimo de 8 caracteres")
    .max(128, "No puede tener mas de 128 caracteres"),
});

export type SigninFormValues = z.infer<typeof SigninFormSchema>;
