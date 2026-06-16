import z from "zod";

export const ResendVerificationSchema = z.object({
  email: z.email("Email inválido").min(1, "Campo requerido"),
});

export type ResendVerificationFormValues = z.infer<
  typeof ResendVerificationSchema
>;
