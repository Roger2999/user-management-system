import z from "zod";

export const ForgotPasswordSchema = z.object({
  email: z
    .email()
    .min(1, "Campo obligatorio")
    .max(254, "Máximo 254 caracteres"),
});
export type ForgotPasswordFormValues = z.infer<typeof ForgotPasswordSchema>;
