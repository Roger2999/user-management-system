import z from "zod";

export const SigninFormSchema = z.object({
  username: z
    .string()
    .min(1, "Campo obligatorio")
    .max(50, "No puede tener más de 50 caracteres"),
  password: z
    .string()
    .min(8, "Mínimo de 8 caracteres")
    .max(128, "No puede tener más de 128 caracteres"),
});

export type SigninFormValues = z.infer<typeof SigninFormSchema>;
