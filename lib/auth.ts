import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import prisma from "@/lib/prisma";
import { resend } from "./resend";
import { EmailTemplate } from "@/components/email-template";
export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    autoSignIn: true,
    maxPasswordLength: 128,
    minPasswordLength: 8,
    sendResetPassword: async (data) => {
      void resend.emails.send({
        from: "onboarding@resend.dev",
        to: data.user.email,
        subject: "Restablecer contraseña",
        html: `
          <h2>Recupera tu contraseña</h2>
          <p>Haz clic en el enlace para restablecer tu contraseña:</p>
          <a href="${data.url}">Restablecer contraseña</a>
          <p>El enlace expira en 1 hora.</p>
        `,
        text: `Haz clic en el enlace para restablecer tu contraseña: ${data.url}`,
      });
    },
  },

  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url }) => {
      void resend.emails.send({
        from: "onboarding@resend.dev",
        to: user.email,
        subject: "Verifica tu email",
        react: EmailTemplate({ name: user.name, url }),
      });
    },
  },

  trustedOrigins: [
    "http://localhost:3000",
    "https://user-manangment.vercel.app",
  ],
  plugins: [nextCookies()],
});
