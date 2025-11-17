import { PrismaClient } from '@prisma/client';
import { auth } from '../lib/auth';
import { fromNodeHeaders } from 'better-auth/node';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function setActiveOrganization(sessionToken: string, organizationId: string) {
    try {
        console.log('🏢 Setting active organization...');
        
        // Use Better Auth's built-in setActive endpoint with correct format
        const result = await auth.api.setActiveOrganization({
            headers: fromNodeHeaders({
                'cookie': `better-auth.session_token=${sessionToken}`
            }),
            body: {
                organizationId: organizationId
            }
        });

        console.log('✅ Active organization set successfully!');
        return {
            success: true,
            result: result
        };

    } catch (error) {
        console.error('❌ Error setting active organization:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : String(error)
        };
    }
}

async function getActiveOrganization(sessionToken: string) {
    try {
        // Use Better Auth's built-in API to get active organization
        const result = await auth.api.getFullOrganization({
            headers: fromNodeHeaders({
                'cookie': `better-auth.session_token=${sessionToken}`
            })
        });

        return result;

    } catch (error) {
        console.error('❌ Error getting active organization:', error);
        return null;
    }
}

async function listUserOrganizations(sessionToken: string) {
    try {
        console.log('📋 Listing user organizations...');
        
        // Use Better Auth's built-in API to list organizations
        const organizations = await auth.api.listOrganizations({
            headers: fromNodeHeaders({
                'cookie': `better-auth.session_token=${sessionToken}`
            })
        });

        console.log(`\n🏢 Organizations (${organizations.length}):`);
        
        organizations.forEach((org, index) => {
            // The organization object from Better Auth API may have different structure
            const roleInfo = (org as any).role || 'member'; // Default to 'member' if role not available
            console.log(`  ${index + 1}. ${org.name} (${org.id}) - Role: ${roleInfo}`);
        });

        return organizations;

    } catch (error) {
        console.error('❌ Error listing organizations:', error);
        return [];
    }
}

function loadSessionToken(): string | null {
    try {
        const authFile = path.join(__dirname, 'http-auth-session.json');
        if (fs.existsSync(authFile)) {
            const sessionData = JSON.parse(fs.readFileSync(authFile, 'utf-8'));
            // Extract just the token value from the cookie
            const cookieValue = sessionData.cookie;
            const tokenMatch = cookieValue.match(/better-auth\.session_token=([^;]+)/);
            if (tokenMatch) {
                return decodeURIComponent(tokenMatch[1]);
            }
        }
    } catch (error) {
        console.error('Error loading session token:', error);
    }
    return null;
}

async function main() {
    console.log('🚀 Organization Management Script\n');

    const sessionToken = loadSessionToken();
    if (!sessionToken) {
        console.log('❌ No session token found. Please sign in first using http-auth.ts');
        return;
    }

    console.log(`🔑 Using session token: ${sessionToken.substring(0, 20)}...`);

    // List user organizations
    const organizations = await listUserOrganizations(sessionToken);
    
    if (organizations.length === 0) {
        console.log('❌ User is not a member of any organizations');
        return;
    }

    // Show current active organization
    console.log('\n🔍 Current active organization:');
    const current = await getActiveOrganization(sessionToken);
    if (current) {
        console.log(`  ✅ ${current.name} (${current.id})`);
        console.log(`  👥 Members: ${current.members?.length || 0}`);
    } else {
        console.log('  ⚪ No active organization set');
    }

    // If no active organization is set, set the first one as active
    if (!current && organizations.length > 0) {
        console.log('\n🔄 Setting first organization as active...');
        const result = await setActiveOrganization(sessionToken, organizations[0].id);
        
        if (result.success) {
            console.log('\n🎉 Organization set successfully!');
            console.log('You can now make API calls with organization context.');
            
            // Show the updated active organization
            const updated = await getActiveOrganization(sessionToken);
            if (updated) {
                console.log(`\n✅ New active organization: ${updated.name}`);
            }
        }
    }
}

// Export functions for use in other scripts
export { setActiveOrganization, getActiveOrganization, listUserOrganizations, loadSessionToken };

// Run if executed directly
if (require.main === module) {
    main()
        .catch(console.error)
        .finally(() => prisma.$disconnect());
}
