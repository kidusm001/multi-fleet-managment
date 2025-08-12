import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { PrismaClient } from "@prisma/client";
import { admin } from "better-auth/plugins";

const prisma = new PrismaClient();

export const auth = betterAuth({
  appName: "Shuttle Management",
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
    minPasswordLength: 8,
    maxPasswordLength: 128,
  },
  // Extend the user schema with a role field
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: true,
        defaultValue: "recruiter",
        // Do not allow users to set this during sign-up
        input: false,
      },
    },
  },
  plugins: [
    admin({
      defaultRole: "recruiter",
      adminRole: ["admin"],
    }),
  ],
  trustedOrigins: [
    "http://localhost:3000/api/auth",
    "http://localhost:3000",
    "http://localhost:5173"
  ],
});
