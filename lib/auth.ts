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
