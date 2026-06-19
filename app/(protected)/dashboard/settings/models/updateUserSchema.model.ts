import z from "zod";

export const UpdateUserSchema = z.object({
  username: z
    .string()
    .min(3, "Minimo de 3 caracteres")
    .max(20, "Maximo de 20 caracteres"),
});

export type UpdateUserFormValues = z.infer<typeof UpdateUserSchema>;
