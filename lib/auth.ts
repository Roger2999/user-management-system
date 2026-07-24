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
      console.log("Sending verification email to:", user.email);
      const result = await resend.emails.send({
        from: "onboarding@resend.dev",
        to: user.email,
        subject: "Verifica tu email",
        react: EmailTemplate({ name: user.name, url }),
      });
      console.log("Resend result:", JSON.stringify(result, null, 2));
      if (result.error) {
        console.error("Error sending verification email:", result.error);
      }
    },
  },

  trustedOrigins: ["http://localhost:3000", "https://sigel-eemtz.vercel.app"],
  plugins: [nextCookies()],
});
