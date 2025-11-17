import { PrismaClient } from '@prisma/client';
import { auth } from '../lib/auth';
import { generateUniqueEthiopianNames } from '../utils/uniqueEthiopianNames';

const prisma = new PrismaClient();

// Generate 30 unique Ethiopian members
const newMembers = generateUniqueEthiopianNames(30).map(member => ({
  ...member,
  role: "employee"
}));

async function addMembersToSterling() {
    console.log('🏢 Adding members to Sterling Logistics Solutions...\n');

    try {
        const org = await prisma.organization.findFirst({
            where: { slug: 'sterling-logistics' }
        });

        if (!org) {
            throw new Error('Sterling Logistics Solutions not found');
        }

        console.log(`✅ Found organization: ${org.name} (${org.id})\n`);

        const departments = await prisma.department.findMany({
            where: { organizationId: org.id }
        });

        if (departments.length === 0) {
            throw new Error('No departments found for Sterling Logistics');
        }

        console.log(`📂 Found ${departments.length} departments\n`);

        const shifts = await prisma.shift.findMany({
            where: { organizationId: org.id }
        });

        if (shifts.length === 0) {
            throw new Error('No shifts found for Sterling Logistics');
        }

        console.log(`⏰ Found ${shifts.length} shifts\n`);

        let usersCreated = 0;
        let membersAdded = 0;
        let employeesCreated = 0;

        for (const member of newMembers) {
            try {
                let userData;
                let userCreated = false;
                
                // Step 1: Create or get user via Better Auth
                try {
                    userData = await auth.api.signUpEmail({
                        body: {
                            name: member.name,
                            email: member.email,
                            password: 'Employee123!',
                        },
                    });
                    console.log(`✅ Created user: ${member.name} (${member.email})`);
                    usersCreated++;
                    userCreated = true;
                } catch (error: any) {
                    if (error.body?.code === 'USER_ALREADY_EXISTS') {
                        console.log(`⚠️  User ${member.email} already exists, fetching...`);
                        const existingUser = await prisma.user.findUnique({
                            where: { email: member.email }
                        });
                        
                        if (!existingUser) {
                            console.log(`❌ Could not find user ${member.email}, skipping...\n`);
                            continue;
                        }
                        
                        userData = { user: existingUser };
                    } else {
                        console.log(`❌ Failed to create user ${member.name}: ${error.message}\n`);
                        continue;
                    }
                }

                // Verify user exists before proceeding
                const userExists = await prisma.user.findUnique({
                    where: { id: userData.user.id }
                });

                if (!userExists) {
                    console.log(`❌ User verification failed for ${member.name}, skipping...\n`);
                    continue;
                }

                // Step 2: Add as member to organization via Better Auth
                let memberAdded = false;
                try {
                    await auth.api.addMember({
                        body: {
                            organizationId: org.id,
                            userId: userData.user.id,
                            role: member.role as 'employee',
                        },
                    });
                    console.log(`   ➕ Added to organization as ${member.role}`);
                    membersAdded++;
                    memberAdded = true;
                } catch (error: any) {
                    if (error.body?.code === 'MEMBER_ALREADY_EXISTS' || error.message?.includes('already exists')) {
                        console.log(`   ⚠️  Already a member of organization`);
                        memberAdded = true;
                    } else {
                        console.log(`   ❌ Could not add to org: ${error.message}, skipping...\n`);
                        continue;
                    }
                }

                // Verify member was created
                if (memberAdded) {
                    const memberExists = await prisma.member.findFirst({
                        where: {
                            userId: userData.user.id,
                            organizationId: org.id
                        }
                    });

                    if (!memberExists) {
                        console.log(`   ❌ Member verification failed for ${member.name}, skipping...\n`);
                        continue;
                    }
                }

                // Step 3: Create employee record (only if user and member exist)
                const existingEmployee = await prisma.employee.findFirst({
                    where: {
                        userId: userData.user.id,
                        organizationId: org.id
                    }
                });

                if (existingEmployee) {
                    console.log(`   ⚠️  Employee record already exists\n`);
                    continue;
                }

                const departmentIndex = employeesCreated % departments.length;
                const department = departments[departmentIndex];
                
                const shiftIndex = employeesCreated % shifts.length;
                const shift = shifts[shiftIndex];

                const employee = await prisma.employee.create({
                    data: {
                        name: member.name,
                        organizationId: org.id,
                        departmentId: department.id,
                        shiftId: shift.id,
                        userId: userData.user.id,
                    },
                });

                console.log(`   👤 Created employee record (Dept: ${department.name}, Shift: ${shift.name})\n`);
                employeesCreated++;

            } catch (error: any) {
                console.error(`❌ Error processing ${member.name}:`, error.message, '\n');
            }
        }

        console.log('✅ Completed!\n');
        console.log(`📊 Summary:`);
        console.log(`   Users created: ${usersCreated}`);
        console.log(`   Members added to org: ${membersAdded}`);
        console.log(`   Employee records created: ${employeesCreated}`);

    } catch (error) {
        console.error('❌ Error:', error);
        throw error;
    }
}

addMembersToSterling()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
