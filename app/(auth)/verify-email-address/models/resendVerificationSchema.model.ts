import z from "zod";

export const ResendVerificationSchema = z.object({
  email: z.email("Correo inválido").min(1, "Campo obligatorio"),
});

export type ResendVerificationFormValues = z.infer<
  typeof ResendVerificationSchema
>;
