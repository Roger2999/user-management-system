import { Resend } from "resend";

// El constructor de Resend lanza si no recibe una clave. Si `RESEND_API_KEY`
// no está configurada, el import de este módulo rompería el build y todas las
// rutas de auth. Con el placeholder la app arranca igual y solo el envío de
// emails falla (ya capturado y logueado en `sendResetPassword`).
export const resend = new Resend(
  process.env.RESEND_API_KEY ?? "re_placeholder_not_configured",
);
