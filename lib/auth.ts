import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import prisma from "@/lib/prisma";
export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
    maxPasswordLength: 128,
    minPasswordLength: 8,
  },
  trustedOrigins: [
    "http://localhost:3000",
    "https://user-manangment.vercel.app",
  ],

  plugins: [nextCookies()],
});
