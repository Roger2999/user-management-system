import z from "zod";

export const ForgotPasswordSchema = z.object({
  email: z.email().min(1, "Campo obligatorio"),
});
export type ForgotPasswordFormValues = z.infer<typeof ForgotPasswordSchema>;
