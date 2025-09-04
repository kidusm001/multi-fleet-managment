import { auth } from '../lib/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface UserWithRole {
    id: string;
    email: string;
    name: string;
    role: 'superadmin' | 'user';
}

interface OrganizationSetup {
    name: string;
    slug: string;
    ownerId: string;
    description?: string;
    members: {
        userId: string;
        role: 'owner' | 'admin' | 'manager' | 'driver' | 'employee';
    }[];
}

/**
 * Fleet organizations to create with realistic business scenarios
 * Using actual users that exist in the database
 */
const organizationTemplates = [
    {
        name: "Mitchell Transport Co",
        slug: "mitchell-transport",
        description: "International freight and express delivery services",
        ownerEmail: "natalie.mitchell@fleetmanager.com",
        adminEmails: ["jennifer.davis@fleetmanager.com"],
        managerEmails: ["lisa.park@fleetmanager.com"],
        driverEmails: [
            "christopher.taylor@fleetmanager.com",
            "matthew.adams@fleetmanager.com",
            "mark.taylor@fleetmanager.com"
        ],
        employeeEmails: [
            "daniel.anderson@fleetmanager.com",
            "thomas.moore@fleetmanager.com"
        ]
    },
    {
        name: "Metro City Transit",
        slug: "metro-transit",
        description: "Urban public transportation and shuttle services",
        ownerEmail: "daniel.scott@fleetmanager.com",
        adminEmails: ["emily.chen@fleetmanager.com"],
        managerEmails: ["jennifer.davis@fleetmanager.com"],
        driverEmails: [
            "marcus.jones@fleetmanager.com",
            "steven.clark@fleetmanager.com",
            "paul.anderson@fleetmanager.com"
        ],
        employeeEmails: [
            "angela.davis@fleetmanager.com",
            "patricia.lewis@fleetmanager.com"
        ]
    },
    {
        name: "Garcia Freight Lines",
        slug: "garcia-freight",
        description: "Heavy-duty freight and cargo transportation services",
        ownerEmail: "maria.garcia@fleetmanager.com",
        adminEmails: ["ashley.white@fleetmanager.com"],
        managerEmails: ["amanda.williams@fleetmanager.com"],
        driverEmails: [
            "kevin.martinez@fleetmanager.com",
            "benjamin.perez@fleetmanager.com",
            "carlos.hernandez@fleetmanager.com"
        ],
        employeeEmails: [
            "alexander.martin@fleetmanager.com",
            "gregory.miller@fleetmanager.com"
        ]
    },
    {
        name: "Johnson Delivery Co",
        slug: "johnson-delivery",
        description: "Last-mile delivery and courier services",
        ownerEmail: "nicole.johnson@fleetmanager.com",
        adminEmails: ["stephanie.young@fleetmanager.com"],
        managerEmails: ["olivia.johnson@fleetmanager.com"],
        driverEmails: [
            "lucas.harris@fleetmanager.com",
            "noah.wilson@fleetmanager.com",
            "ethan.moore@fleetmanager.com"
        ],
        employeeEmails: [
            "helen.cooper@fleetmanager.com",
            "patricia.lewis@fleetmanager.com"
        ]
    },
    {
        name: "Sterling Logistics Solutions",
        slug: "sterling-logistics",
        description: "Comprehensive logistics and supply chain management services",
        ownerEmail: "robert.sterling@fleetmanager.com",
        adminEmails: ["john.mitchell@fleetmanager.com"],
        managerEmails: ["mike.rodriguez@fleetmanager.com"],
        driverEmails: [
            "robert.johnson@fleetmanager.com",
            "michael.lee@fleetmanager.com",
            "david.wilson@fleetmanager.com"
        ],
        employeeEmails: [
            "james.brown@fleetmanager.com",
            "william.martinez@fleetmanager.com"
        ]
    }
];

async function getAllUsers(): Promise<UserWithRole[]> {
    const users = await prisma.user.findMany({
        select: {
            id: true,
            email: true,
            name: true,
            role: true
        }
    });
    
    return users.map(user => ({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role as 'superadmin' | 'user'
    }));
}

async function updateUserSubscriptions() {
    console.log('📝 Updating user subscriptions...');
    
    // Get all organization owners and key personnel who need subscriptions
    const subscriptionEmails = [
        // SuperAdmin
        'superadmin@fleetmanager.com',
        // Existing owners and key personnel
        'robert.sterling@fleetmanager.com',
        'john.mitchell@fleetmanager.com',
        'mike.rodriguez@fleetmanager.com',
        // New organization owners
        'natalie.mitchell@fleetmanager.com',
        'daniel.scott@fleetmanager.com',
        'maria.garcia@fleetmanager.com',
        'nicole.johnson@fleetmanager.com',
        // Key admins and managers
        'jennifer.davis@fleetmanager.com',
        'lisa.park@fleetmanager.com',
        'emily.chen@fleetmanager.com',
        'ashley.white@fleetmanager.com',
        'amanda.williams@fleetmanager.com',
        'stephanie.young@fleetmanager.com',
        'olivia.johnson@fleetmanager.com'
    ];

    const organizationalUsers = await prisma.user.findMany({
        where: {
            email: {
                in: subscriptionEmails
            }
        }
    });

    for (const user of organizationalUsers) {
        await prisma.user.update({
            where: { id: user.id },
            data: { isSubscribed: true }
        });
        console.log(`✅ Updated subscription for ${user.email}`);
    }
    
    console.log(`📊 Updated ${organizationalUsers.length} users with subscriptions\n`);
}

async function getUserByEmail(email: string, users: UserWithRole[]): Promise<UserWithRole | null> {
    return users.find(user => user.email === email) || null;
}

async function createOrganizationWithMembers(
    orgTemplate: typeof organizationTemplates[0], 
    users: UserWithRole[]
): Promise<void> {
    console.log(`🏢 Creating organization: ${orgTemplate.name}`);
    
    // Find owner
    const owner = await getUserByEmail(orgTemplate.ownerEmail, users);
    if (!owner) {
        console.error(`❌ Owner not found: ${orgTemplate.ownerEmail}`);
        return;
    }

    try {
        // Create organization using Better Auth
        const organization = await auth.api.createOrganization({
            body: {
                name: orgTemplate.name,
                slug: orgTemplate.slug,
                userId: owner.id, // Owner's ID
                keepCurrentActiveOrganization: false,
            },
        });

        console.log(`✅ Created organization: ${orgTemplate.name} (${orgTemplate.slug})`);
        console.log(`   Owner: ${owner.email}`);

        // Add admin members
        for (const adminEmail of orgTemplate.adminEmails) {
            const admin = await getUserByEmail(adminEmail, users);
            if (admin && organization) {
                try {
                    // Use the addMember API for direct membership without invitation
                    await auth.api.addMember({
                        body: {
                            userId: admin.id,
                            organizationId: organization.id,
                            role: 'admin',
                        },
                    });
                    
                    console.log(`   ✅ Added admin: ${admin.email}`);
                } catch (error) {
                    console.error(`   ❌ Failed to add admin ${admin.email}:`, error);
                }
            }
        }

        // Add manager members
        for (const managerEmail of orgTemplate.managerEmails) {
            const manager = await getUserByEmail(managerEmail, users);
            if (manager && organization) {
                try {
                    await auth.api.addMember({
                        body: {
                            userId: manager.id,
                            organizationId: organization.id,
                            role: 'manager',
                        },
                    });
                    
                    console.log(`   ✅ Added manager: ${manager.email}`);
                } catch (error) {
                    console.error(`   ❌ Failed to add manager ${manager.email}:`, error);
                }
            }
        }

        // Add driver members
        for (const driverEmail of orgTemplate.driverEmails) {
            const driver = await getUserByEmail(driverEmail, users);
            if (driver && organization) {
                try {
                    await auth.api.addMember({
                        body: {
                            userId: driver.id,
                            organizationId: organization.id,
                            role: 'driver',
                        },
                    });
                    
                    console.log(`   ✅ Added driver: ${driver.email}`);
                } catch (error) {
                    console.error(`   ❌ Failed to add driver ${driver.email}:`, error);
                }
            }
        }

        // Add employee members
        for (const employeeEmail of orgTemplate.employeeEmails) {
            const employee = await getUserByEmail(employeeEmail, users);
            if (employee && organization) {
                try {
                    await auth.api.addMember({
                        body: {
                            userId: employee.id,
                            organizationId: organization.id,
                            role: 'employee',
                        },
                    });
                    
                    console.log(`   ✅ Added employee: ${employee.email}`);
                } catch (error) {
                    console.error(`   ❌ Failed to add employee ${employee.email}:`, error);
                }
            }
        }

        console.log(`🎉 Successfully set up organization: ${orgTemplate.name}\n`);

    } catch (error) {
        console.error(`❌ Failed to create organization ${orgTemplate.name}:`, error);
    }
}

async function main() {
    try {
        console.log('🚀 Setting up Organizations with Better Auth');
        console.log('============================================\n');

        // Step 1: Update user subscriptions
        await updateUserSubscriptions();

        // Step 2: Get all users
        const users = await getAllUsers();
        console.log(`📊 Found ${users.length} users in the system\n`);

        // Step 3: Create organizations with members
        for (const orgTemplate of organizationTemplates) {
            await createOrganizationWithMembers(orgTemplate, users);
            // Add a small delay between organization creations
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        console.log('🎉 All organizations created successfully!');
        console.log('\n📋 Summary:');
        console.log(`   Organizations created: ${organizationTemplates.length}`);
        console.log('   Each organization has:');
        console.log('     - 1 Owner');
        console.log('     - 1+ Admins');
        console.log('     - 1+ Managers');
        console.log('     - 3+ Drivers');
        console.log('     - 2+ Employees');

    } catch (error) {
        console.error('💥 Error setting up organizations:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

if (require.main === module) {
    main()
        .then(() => {
            console.log('\n✅ Setup completed successfully!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n❌ Setup failed:', error);
            process.exit(1);
        });
}

export { main as setupOrganizationsWithAuth };
