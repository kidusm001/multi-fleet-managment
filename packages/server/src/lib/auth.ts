import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { PrismaClient } from '@prisma/client';
import { admin, organization } from 'better-auth/plugins';
import {fayda} from 'fayda';
import { AdminAc, OrgAc, superadmin, user, owner, admin as organizationAdmin, manager, driver, employee } from './permissions';
import { Resend } from 'resend';
import dotenv from 'dotenv';
import { loadAndInterpolateTemplate } from '../services/emailService';

dotenv.config();


const prisma = new PrismaClient();
const resend = new Resend(process.env.RESEND_API_KEY!);

export const auth = betterAuth({
    baseURL: process.env.AUTH_BASE_URL || 'http://localhost:3000',
    basePath: '/api/auth',
    database: prismaAdapter(prisma, { provider: 'postgresql' }),
    emailAndPassword: {
        enabled: true,
        minPasswordLength: 8,
        maxPasswordLength: 128,
    },
    session: {
        expiresIn: 60 * 60 * 24 * 7, // 7 days
        updateAge: 60 * 60 * 24, // 1 day
    },
    user: {
        additionalFields: {
            isSubscribed: {
                type: 'boolean',
                defaultValue: false,
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
            ac: AdminAc,
            roles: {
                superadmin,
                user,
            }
        }),
        organization({
            async sendInvitationEmail(data) {
                const inviteLink = `${process.env.BETTER_AUTH_URL}/api/accept-invitation/${data.id}`;
                resend.emails.send({
                    from: `${process.env.RESEND_SENDER_NAME} <${process.env.RESEND_SENDER_EMAIL}>`,
                    to: data.email,
                    subject: "Organization Invitation",
                    html: await loadAndInterpolateTemplate('organization-invitation.html', {
                        organizationName: data.organization.name,
                        email: data.email,
                        invitedByUsername: data.inviter.user.name,
                        invitedByEmail: data.inviter.user.email,
                        inviteLink
                    })
                });
            },
            allowUserToCreateOrganization: async (user) => {
              return await gotSubscribed(user.id);
            },
            organizationLimit: 5,
            membershipLimit: 500, // Increased from default 100 to accommodate more employees
            ac: OrgAc,
            roles: {
                owner,
                admin: organizationAdmin,
                manager,
                driver,
                employee,
            }
        }),
        await fayda({
            clientId: process.env.CLIENT_ID!,
            privateKey: process.env.PRIVATE_KEY!,
            redirectUrl: "http://localhost:3000/callback"
        }).then(plugin => {
            console.log('✅ Fayda plugin configured with:', {
                clientId: process.env.CLIENT_ID?.substring(0, 10) + '...',
                redirectUrl: "http://localhost:3000/callback",
                privateKeyPresent: !!process.env.PRIVATE_KEY
            });
            return plugin;
        })
    ],

	account: {
		accountLinking: {
			enabled: true,
			trustedProviders: ['fayda']
		}
	},

    trustedOrigins: [
        "http://localhost:3000/api/auth",
        "http://localhost:3000",
        "http://localhost:5173"
    ],
    logger: {
        level: "debug",
    },


    databaseHooks: {
        user: {
            create: {
                before: async (user) => {
                    const isFirstUser = await checkIfFirstUser();
                    // Only log user creation in production or if explicitly enabled
                    if (process.env.NODE_ENV === 'production' || process.env.ENABLE_AUTH_LOGGING === 'true') {
                        console.log("Creating user, isFirstUser:", isFirstUser);
                    }
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

async function gotSubscribed(userId: string) {
try {
    const user = await prisma.user.findUnique({
        where: { id: userId },
    });
    return user?.isSubscribed || false;
} catch (error) {
   return false; 
}
}

async function checkIfFirstUser() {
    const count = await prisma.user.count();
    return count === 0;
}

export type AuthInstance = typeof auth;
