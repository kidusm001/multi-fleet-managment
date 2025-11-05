import { PrismaClient } from '@prisma/client';
import { auth } from '../lib/auth';

const prisma = new PrismaClient();

interface SyntheticEmployee {
  name: string;
  email: string;
}

// Generate realistic synthetic employees for Sterling Logistics
function generateSyntheticEmployees(count: number): SyntheticEmployee[] {
  const firstNames = [
    'Sarah', 'Jennifer', 'Michael', 'David', 'John', 'Richard', 'Joseph', 'Thomas',
    'Charles', 'Christopher', 'Daniel', 'Matthew', 'Anthony', 'Mark', 'Donald', 'Steven',
    'Paul', 'Andrew', 'Joshua', 'Kenneth', 'Kevin', 'Brian', 'George', 'Edward',
    'Ronald', 'Timothy', 'Jason', 'Jeffrey', 'Ryan', 'Jacob', 'Gary', 'Nicholas',
    'Eric', 'Jonathan', 'Stephen', 'Larry', 'Justin', 'Scott', 'Brandon', 'Benjamin',
    'Samuel', 'Frank', 'Gregory', 'Alexander', 'Patrick', 'Jack', 'Dennis', 'Jerry'
  ];

  const lastNames = [
    'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
    'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson',
    'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson',
    'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson', 'Young',
    'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Peterson', 'Phillips', 'Campbell',
    'Parker', 'Evans', 'Edwards', 'Collins', 'Reyes', 'Stewart', 'Morris', 'Rogers',
    'Morgan', 'Peterson', 'Cooper', 'Reed', 'Cook', 'Morgan', 'Bell', 'Murphy',
    'Bailey', 'Rivera', 'Cooper', 'Richardson', 'Cox', 'Howard', 'Ward', 'Cox'
  ];

  const employees: SyntheticEmployee[] = [];
  const usedEmails = new Set<string>();

  for (let i = 0; i < count; i++) {
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const fullName = `${firstName} ${lastName}`;
    
    // Generate unique email
    let email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@sterling-logistics.local`;
    let counter = 1;
    while (usedEmails.has(email)) {
      email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${counter}@sterling-logistics.local`;
      counter++;
    }
    usedEmails.add(email);

    employees.push({
      name: fullName,
      email
    });
  }

  return employees;
}

// Create a user via Better Auth
async function createUserViaBetterAuth(email: string, name: string): Promise<string | null> {
  try {
    // Create user via Better Auth signUp API
    const result = await auth.api.signUpEmail({
      body: {
        email,
        name,
        password: 'TempPassword123!' // Temporary password, user should change it
      }
    });

    // Check if user was created successfully
    if (result && result.user && result.user.id) {
      return result.user.id;
    }
    
    return null;
  } catch (error: any) {
    // User might already exist, try to find them
    try {
      const existingUser = await prisma.user.findUnique({
        where: { email }
      });
      if (existingUser) {
        return existingUser.id;
      }
    } catch {}
    
    console.warn(`⚠️  Could not create or find user ${email}:`, error.message);
    return null;
  }
}

async function main() {
  console.log('\n╔' + '═'.repeat(70) + '╗');
  console.log('║' + ' '.repeat(10) + '🚀 Adding More Employees to Sterling Logistics' + ' '.repeat(14) + '║');
  console.log('╚' + '═'.repeat(70) + '╝\n');

  try {
    // Get Sterling Logistics organization
    const sterling = await prisma.organization.findFirst({
      where: { slug: 'sterling-logistics' },
      include: {
        locations: true,
        departments: true,
        shifts: true,
        _count: {
          select: { employees: true }
        }
      }
    });

    if (!sterling) {
      console.error('❌ Sterling Logistics organization not found');
      process.exit(1);
    }

    console.log(`📊 Current Status for ${sterling.name}:`);
    console.log(`   Existing employees: ${sterling._count.employees}`);
    console.log(`   Locations: ${sterling.locations.length}`);
    console.log(`   Departments: ${sterling.departments.length}`);
    console.log(`   Shifts: ${sterling.shifts.length}\n`);

    if (sterling.locations.length === 0 || sterling.departments.length === 0 || sterling.shifts.length === 0) {
      console.error('❌ Sterling Logistics must have locations, departments, and shifts before adding employees');
      process.exit(1);
    }

    // Generate 50 new synthetic employees
    const newEmployeeCount = 50;
    const syntheticEmployees = generateSyntheticEmployees(newEmployeeCount);

    console.log(`📝 Generating ${newEmployeeCount} synthetic employees...\n`);
    console.log(`🔐 Creating users via Better Auth...\n`);

    const createdUserIds: string[] = [];
    let createdUserCount = 0;

    for (const synthEmployee of syntheticEmployees) {
      const userId = await createUserViaBetterAuth(synthEmployee.email, synthEmployee.name);
      
      if (userId) {
        createdUserIds.push(userId);
        createdUserCount++;

        if (createdUserCount % 10 === 0) {
          console.log(`   ✅ Created ${createdUserCount}/${newEmployeeCount} users`);
        }
      }
    }

    console.log(`\n✅ Successfully created ${createdUserCount} users\n`);

    if (createdUserIds.length === 0) {
      console.error('❌ No users were created. Cannot continue.');
      process.exit(1);
    }

    console.log(`👥 Creating employees and assigning to Sterling Logistics...\n`);

    let createdEmployeeCount = 0;

    for (let i = 0; i < createdUserIds.length; i++) {
      const userId = createdUserIds[i];
      const synthEmployee = syntheticEmployees[i];

      // Round-robin assignment to avoid overloading
      const locationIndex = i % sterling.locations.length;
      const departmentIndex = i % sterling.departments.length;
      const shiftIndex = i % sterling.shifts.length;

      const location = sterling.locations[locationIndex];
      const department = sterling.departments[departmentIndex];
      const shift = sterling.shifts[shiftIndex];

      try {
        const employee = await prisma.employee.create({
          data: {
            organizationId: sterling.id,
            name: synthEmployee.name,
            departmentId: department.id,
            shiftId: shift.id,
            locationId: location.id,
            userId: userId,
            assigned: true
          }
        });

        // Create a unique stop for this employee
        const stopLatitude = (location.latitude ?? 9.03) + (Math.random() - 0.5) * 0.01;
        const stopLongitude = (location.longitude ?? 38.74) + (Math.random() - 0.5) * 0.01;

        const stop = await prisma.stop.create({
          data: {
            organizationId: sterling.id,
            name: `Stop - ${synthEmployee.name}`,
            latitude: stopLatitude,
            longitude: stopLongitude
          }
        });

        // Assign stop to employee
        await prisma.employee.update({
          where: { id: employee.id },
          data: { stopId: stop.id }
        });

        // Add employee as member to organization via Better Auth
        try {
          await auth.api.addMember({
            body: {
              organizationId: sterling.id,
              userId: userId,
              role: 'employee' as const,
            },
          });
        } catch (memberError: any) {
          if (!memberError.message?.includes('already exists')) {
            console.warn(`⚠️  Could not add ${synthEmployee.name} as member:`, memberError.message);
          }
        }

        createdEmployeeCount++;

        if (createdEmployeeCount % 10 === 0) {
          console.log(`   ✅ Created ${createdEmployeeCount}/${createdUserIds.length} employees`);
        }
      } catch (error: any) {
        console.error(`❌ Failed to create employee for ${synthEmployee.name}:`, error.message);
        continue;
      }
    }

    console.log(`\n✅ Successfully created ${createdEmployeeCount} new employees\n`);

    // Verify final count
    const finalCount = await prisma.employee.count({
      where: { organizationId: sterling.id }
    });

    const employeesWithoutStop = await prisma.employee.count({
      where: {
        organizationId: sterling.id,
        stopId: null
      }
    });

    console.log('📈 Final Statistics:');
    console.log(`   Total employees: ${finalCount}`);
    console.log(`   Employees without stops: ${employeesWithoutStop}\n`);

    if (employeesWithoutStop > 0) {
      console.warn(`⚠️  ${employeesWithoutStop} employees still don't have stops assigned`);
    } else {
      console.log('✅ All employees have stops assigned!\n');
    }

  } catch (error: any) {
    console.error('\n❌ Error adding employees:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
