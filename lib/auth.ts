import prisma from "@/lib/prisma";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { username } from "better-auth/plugins";
import { resend } from "./resend";
export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
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
  advanced: {
    useSecureCookies: process.env.NODE_ENV === "production",
    defaultCookieAttributes: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    },
  },
  emailAndPassword: {
    enabled: true,
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

  trustedOrigins: ["http://localhost:3000", "https://sigel-eemtz.vercel.app"],
  //username()-plugin de better-auth para autenticacion a traves del username-password
  //se debe agregar al schema de prisma username @unique @db.Citext y displayName
  //migrar db y generar cliente
  //ajutar tipos y schemas de zod de formularios
  //ajustar actions de signin y signup
  plugins: [nextCookies(), username()],
});
