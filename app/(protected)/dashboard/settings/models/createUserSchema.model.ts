import z from "zod";

export const CreateUserSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(1, "Campo obligatorio")
    .max(128, "Máximo de 128 caracteres"),
  username: z
    .string()
    .trim()
    .min(3, "Mínimo de 3 caracteres")
    .max(20, "Máximo de 20 caracteres"),
  email: z.email("Correo inválido").max(254, "Máximo de 254 caracteres"),
  position: z
    .string()
    .trim()
    .min(1, "Campo obligatorio")
    .max(100, "Máximo de 100 caracteres"),
  role: z.enum(["USER", "ADMIN"], { message: "Seleccioná un rol" }),
  password: z
    .string()
    .min(8, "Mínimo de 8 caracteres")
    .max(128, "Máximo de 128 caracteres"),
});

export type CreateUserFormValues = z.infer<typeof CreateUserSchema>;
