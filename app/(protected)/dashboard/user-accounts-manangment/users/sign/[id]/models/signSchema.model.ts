import z from "zod";

export const SignFormSchema = z.object({
  requested: z.boolean().default(false),
  revised: z.boolean().default(false),
  approved: z.boolean().default(false),
  executed: z.boolean().default(false),
});

export type SigninFormValues = z.infer<typeof SignFormSchema>;
