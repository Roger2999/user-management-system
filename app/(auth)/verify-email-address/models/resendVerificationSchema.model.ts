import z from "zod";

export const ResendVerificationSchema = z.object({
  email: z
    .email("Correo inválido")
    .min(1, "Campo obligatorio")
    .max(254, "Máximo 254 caracteres"),
});

export type ResendVerificationFormValues = z.infer<
  typeof ResendVerificationSchema
>;
