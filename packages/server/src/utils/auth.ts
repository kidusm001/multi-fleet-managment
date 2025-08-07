import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { PrismaClient } from "@prisma/client";
import { admin } from "better-auth/plugins";

const prisma = new PrismaClient();

export const auth = betterAuth({
  appName: "Multi-Fleet Management",
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
    minPasswordLength: 8,
    maxPasswordLength: 128,
  },
  // Extend the user schema with tenant-aware fields
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: true,
        defaultValue: "MANAGER",
        // Do not allow users to set this during sign-up
        input: false,
      },
      tenantId: {
        type: "string",
        required: true,
        // Allow users to set this during sign-up for tenant selection
        input: true,
      },
      banned: {
        type: "boolean",
        required: false,
        defaultValue: false,
        input: false,
      },
      banReason: {
        type: "string",
        required: false,
        input: false,
      },
      banExpires: {
        // Matches DateTime? in Prisma schema
        type: "date",
        required: false,
        input: false,
      },
    },
  },
  plugins: [
    admin({
      defaultRole: "MANAGER",
      // Only roles present in Role enum
      adminRole: ["ADMIN"],
    }),
  ],
  trustedOrigins: [
    "http://localhost:3001/api/auth",
    "http://localhost:3001",
    "http://localhost:5173"
  ],
});
