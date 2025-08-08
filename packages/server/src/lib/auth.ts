import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { PrismaClient } from '@prisma/client';
import { admin } from 'better-auth/plugins';

const prisma = new PrismaClient();

const baseURL = (process.env.BETTER_AUTH_URL || 'http://localhost:3001').replace(/\/$/, '');

export const auth = betterAuth({
  appName: 'Multi-Fleet Management',
  secret: process.env.BETTER_AUTH_SECRET || 'dev-secret-change',
  baseURL,
  database: prismaAdapter(prisma, { provider: 'postgresql' }),
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
    minPasswordLength: 8,
    maxPasswordLength: 128,
  },
  user: {
    additionalFields: {
      role: { type: 'string', required: true, defaultValue: 'MANAGER', input: false },
      tenantId: { type: 'string', required: true, input: true },
      banned: { type: 'boolean', required: false, defaultValue: false, input: false },
      banReason: { type: 'string', required: false, input: false },
      banExpires: { type: 'date', required: false, input: false },
    },
  },
  plugins: [
    admin({
      defaultRole: 'MANAGER',
      adminRole: ['ADMIN'],
    }),
  ],
  trustedOrigins: [
    'http://localhost:3001/auth',
    'http://localhost:3001',
    'http://localhost:5173',
    'http://127.0.0.1',
    'http://127.0.0.1:3001',
  ],
});

export type AuthInstance = typeof auth;
