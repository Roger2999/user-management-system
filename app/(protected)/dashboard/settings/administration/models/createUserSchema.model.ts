import z from "zod";

export const CreateUserSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(1, "Campo obligatorio")
    .max(128, "Máximo 128 caracteres"),
  username: z
    .string()
    .trim()
    .min(3, "Mínimo 3 caracteres")
    .max(20, "Máximo 20 caracteres"),
  email: z.email("Correo inválido").max(254, "Máximo 254 caracteres"),
  position: z
    .string()
    .trim()
    .min(1, "Campo obligatorio")
    .max(100, "Máximo 100 caracteres"),
  role: z.enum(["USER", "ADMIN"], { message: "Debe seleccionar un rol" }),
  password: z
    .string()
    .min(8, "Mínimo 8 caracteres")
    .max(128, "Máximo 128 caracteres"),
});

export type CreateUserFormValues = z.infer<typeof CreateUserSchema>;
