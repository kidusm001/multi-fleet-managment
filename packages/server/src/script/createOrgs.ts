import { auth } from '../lib/auth';
import * as readline from 'readline';

interface OrganizationData {
    name: string;
    slug: string;
    userId?: string;
}

async function createOrganization(orgData: OrganizationData) {
    try {
        const data = await auth.api.createOrganization({
            body: {
                name: orgData.name, // required
                slug: orgData.slug, // required
                userId: orgData.userId, // server-only
                keepCurrentActiveOrganization: false,
            },
        });

        console.log(`✅ Successfully created organization: ${orgData.name} (${orgData.slug})`);
        return data;
    } catch (error) {
        console.error(`❌ Failed to create organization ${orgData.name} (${orgData.slug}):`, error);
        throw error;
    }
}

function createReadlineInterface() {
    return readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
}

function askQuestion(rl: readline.Interface, question: string): Promise<string> {
    return new Promise((resolve) => {
        rl.question(question, (answer) => {
            resolve(answer.trim());
        });
    });
}

async function promptForOrganization(): Promise<OrganizationData> {
    const rl = createReadlineInterface();
    
    try {
        console.log('🏢 Create New Organization');
        console.log('========================\n');
        
        const name = await askQuestion(rl, '📝 Enter organization name: ');
        if (!name) {
            throw new Error('Organization name is required');
        }
        
        const slug = await askQuestion(rl, '🔗 Enter organization slug (URL-friendly): ');
        if (!slug) {
            throw new Error('Organization slug is required');
        }
        
        // Validate slug format
        const slugRegex = /^[a-z0-9-]+$/;
        if (!slugRegex.test(slug)) {
            throw new Error('Slug must contain only lowercase letters, numbers, and hyphens');
        }
        
        const userId = await askQuestion(rl, '👤 Enter user ID (owner of the organization): ');
        if (!userId) {
            throw new Error('User ID is required for server-side organization creation');
        }
        
        return {
            name,
            slug,
            userId
        };
    } finally {
        rl.close();
    }
}

async function main() {
    try {
        console.log('🚀 Organization Creation Tool');
        console.log('============================\n');
        
        const orgData = await promptForOrganization();
        
        console.log('\n📋 Organization Details:');
        console.log(`   Name: ${orgData.name}`);
        console.log(`   Slug: ${orgData.slug}`);
        console.log(`   Owner ID: ${orgData.userId}\n`);
        
        const rl = createReadlineInterface();
        const confirm = await askQuestion(rl, '❓ Do you want to create this organization? (y/n): ');
        rl.close();
        
        if (confirm.toLowerCase() === 'y' || confirm.toLowerCase() === 'yes') {
            console.log('\n🔄 Creating organization...');
            await createOrganization(orgData);
            console.log('🎉 Organization created successfully!');
        } else {
            console.log('❌ Organization creation cancelled.');
        }
        
    } catch (error) {
        console.error('💥 Error:', error instanceof Error ? error.message : error);
        process.exit(1);
    }
}

// Function to create organization from command line arguments (for programmatic use)
async function createFromArgs(name: string, slug: string, userId: string) {
    const orgData: OrganizationData = {
        name,
        slug,
        userId
    };
    
    return await createOrganization(orgData);
}

// Export functions for use in other scripts
export { createOrganization, createFromArgs };

// Main execution
if (require.main === module) {
    // Check if command line arguments are provided
    const args = process.argv.slice(2);
    
    if (args.length >= 3) {
        // Create organization from command line arguments
        const [name, slug, userId] = args;
        console.log(`🎯 Creating organization from command line: ${name} (${slug}) for user ${userId}`);
        
        createFromArgs(name, slug, userId)
            .then(() => {
                console.log("✅ Organization created successfully!");
                process.exit(0);
            })
            .catch((error) => {
                console.error("❌ Failed to create organization:", error);
                process.exit(1);
            });
    } else {
        // Interactive mode
        main();
    }
}