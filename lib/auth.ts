import prisma from "@/lib/prisma";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { username } from "better-auth/plugins";
import { resend } from "./resend";

// La cookie de sesion solo debe marcarse como "Secure" cuando la app se
// sirve realmente por HTTPS. Si se fuerza en produccion sin un terminador TLS
// delante, el navegador descarta la cookie y la sesion nunca persiste.
const secureCookies = process.env.BETTER_AUTH_URL?.startsWith("https://") ?? false;

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  session: {
    // Las sesiones viven 7 dias (expiresIn por defecto). "freshAge" define
    // cuanto tiempo una sesion cuenta como recien iniciada: better-auth lo
    // exige para listar sesiones y para actualizar el perfil. Con el valor
    // por defecto (24 h) esas acciones fallaban con 403/400 en sesiones que
    // seguian vigentes, rompiendo la pagina de Configuracion.
    freshAge: 60 * 60 * 24 * 7,
  },
  rateLimit: {
    enabled: true,
    window: 10,
    max: 100,
    customRules: {
      "/api/auth/sign-in/email": { window: 60, max: 10 },
      "/api/auth/sign-up/email": { window: 60, max: 5 },
      "/api/auth/forget-password": { window: 60, max: 3 },
      "/api/auth/sign-in/username": { window: 60, max: 10 },
    },
    storage: "memory",
  },
  user: {
    additionalFields: {
      fullName: {
        type: "string",
        required: true,
        input: true,
      },
      role: {
        type: ["USER", "ADMIN"],
        required: false,
        defaultValue: "USER",
        input: false,
      },
      position: {
        type: "string",
        required: true,
        input: true,
      },
    },
  },
  advanced: {
    useSecureCookies: secureCookies,
    defaultCookieAttributes: {
      httpOnly: true,
      secure: secureCookies,
      sameSite: "lax",
    },
  },
  emailAndPassword: {
    enabled: true,
    // El alta de usuarios se hace desde Configuracion por un ADMIN. No hay
    // autoservicio: cualquiera en la red podria crearse una cuenta.
    disableSignUp: true,
    // requireEmailVerification: true,
    autoSignIn: true,
    maxPasswordLength: 128,
    minPasswordLength: 8,
    sendResetPassword: async (data) => {
      const { error } = await resend.emails.send({
        from: "onboarding@resend.dev",
        to: data.user.email,
        subject: "Restablecer contraseña",
        html: `
          <h2 style="font-family: Arial, Helvetica, sans-serif; color: #0f172a; font-size: 20px; margin: 0 0 16px;">Recupera tu contraseña</h2>
          <p style="font-family: Arial, Helvetica, sans-serif; color: #334155; font-size: 14px; margin: 0 0 16px;">Haz clic en el enlace para restablecer tu contraseña:</p>
          <a href="${data.url}" style="display: inline-block; font-family: Arial, Helvetica, sans-serif; background: #0f172a; color: #ffffff; border-radius: 6px; padding: 10px 18px; font-size: 14px; text-decoration: none;">Restablecer contraseña</a>
          <p style="font-family: Arial, Helvetica, sans-serif; color: #64748b; font-size: 12px; margin: 16px 0 0;">El enlace expira en 1 hora.</p>
        `,
        text: `Haz clic en el enlace para restablecer tu contraseña: ${data.url}`,
      });
      if (error) {
        console.error("Error sending reset password email:", error);
      }
    },
  },

  trustedOrigins: [
    "http://localhost:3000",
    "http://172.19.152.250:3000",
    "https://sigel-eemtz.vercel.app",
    "https://ums.elecmtz.une.cu",
  ],
  // username() plugin of better-auth for username-password authentication
  // the prisma schema must add username @unique @db.Citext and displayName
  // migrate the db and generate the client
  // adjust the types and zod schemas of the forms
  // adjust the signin action
  plugins: [nextCookies(), username()],
});
