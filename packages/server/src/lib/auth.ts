import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { PrismaClient } from '@prisma/client';
import { admin, organization } from 'better-auth/plugins';
import {AdminAc, OrgAc, superadmin, user, owner, admin as organizationAdmin, manager, driver, employee} from './permissions';


const prisma = new PrismaClient();

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: 'postgresql' }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    maxPasswordLength: 128,
  },
  user: {
    additionalFields: {
      isSubscribed: {
        type: 'boolean',
        default: false,
        input: false
      }
    }
  },
  plugins: [
    admin({
      defaultRole: 'user',
      adminRoles: ['superadmin'],
      defaultBanReason: "Terms of service violation",
      impersonationSessionDuration: 60 * 60, 
      ac:AdminAc,
      roles: {
        superadmin,
        user,
      }
    }),
    organization({
      // allowUserToCreateOrganization: async (user) => {
      //   return await gotSubscribed(user.id);
      // },
      allowUserToCreateOrganization: false,
      organizationLimit: 5,
      ac:OrgAc,
      roles: {
        owner,
        admin: organizationAdmin,
        manager,
        driver,
        employee,
      }
    }),
  ],

  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          const isFirstUser = await checkIfFirstUser();
          console.log("Creating user, isFirstUser:", isFirstUser);
          return {
            data: {
              ...user,
              role: isFirstUser ? "superadmin" : "user",
            },
          };
        },
      },
    },
  },
});

async function gotSubscribed(userId : string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });
  return user?.isSubscribed;
}

async function checkIfFirstUser() {
  const count = await prisma.user.count();
  return count === 0;
}

export type AuthInstance = typeof auth;
