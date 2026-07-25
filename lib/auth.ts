import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import prisma from "@/lib/prisma";
import { resend } from "./resend";
import { EmailTemplate } from "@/components/email-template";
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
    requireEmailVerification: true,
    autoSignIn: true,
    maxPasswordLength: 128,
    minPasswordLength: 8,
    sendResetPassword: async (data) => {
      const { error } = await resend.emails.send({
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
      if (error) {
        console.error("Error sending reset password email:", error);
      }
    },
  },

  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url }) => {
      await resend.emails.send({
        from: "onboarding@resend.dev",
        to: user.email,
        subject: "Verifica tu email",
        react: EmailTemplate({ name: user.name, url }),
      });
    },
  },

  trustedOrigins: ["http://localhost:3000", "https://sigel-eemtz.vercel.app"],
  plugins: [nextCookies()],
});
