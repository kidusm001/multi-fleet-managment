import { PrismaClient } from '@prisma/client';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';

const execAsync = promisify(exec);
const prisma = new PrismaClient();

async function runCommand(command: string, description: string) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🚀 ${description}`);
  console.log(`${'='.repeat(60)}\n`);
  
  try {
    const { stdout, stderr } = await execAsync(command, { 
      cwd: '/home/leul/Documents/Github/multi-fleet-managment/packages/server',
      maxBuffer: 10 * 1024 * 1024
    });
    if (stdout) console.log(stdout);
    if (stderr) console.error(stderr);
    console.log(`✅ ${description} - COMPLETED\n`);
  } catch (error: any) {
    console.error(`❌ ${description} - FAILED`);
    console.error(error.message);
    throw error;
  }
}

async function cleanDatabase() {
  console.log(`\n${'='.repeat(60)}`);
  console.log('🗑️  CLEANING DATABASE');
  console.log(`${'='.repeat(60)}\n`);

  const dbPath = '/home/leul/Documents/github/multi-fleet-managment/packages/server/prisma/dev.db';
  
  if (fs.existsSync(dbPath)) {
    fs.unlinkSync(dbPath);
    console.log('✅ Deleted existing database\n');
  } else {
    console.log('ℹ️  No existing database found\n');
  }
}

async function verifyData() {
  console.log(`\n${'='.repeat(60)}`);
  console.log('📊 VERIFYING FINAL DATA');
  console.log(`${'='.repeat(60)}\n`);

  const [
    userCount,
    orgCount,
    memberCount,
    employeeCount,
    driverCount,
    vehicleCount,
    routeCount,
    stopCount,
    locationCount,
    notificationCount
  ] = await Promise.all([
    prisma.user.count(),
    prisma.organization.count(),
    prisma.member.count(),
    prisma.employee.count(),
    prisma.driver.count(),
    prisma.vehicle.count(),
    prisma.route.count(),
    prisma.stop.count(),
    prisma.location.count(),
    prisma.notification.count()
  ]);

  console.log('📈 Database Summary:');
  console.log(`   👤 Users: ${userCount}`);
  console.log(`   🏢 Organizations: ${orgCount}`);
  console.log(`   👥 Members: ${memberCount}`);
  console.log(`   💼 Employees: ${employeeCount}`);
  console.log(`   🚗 Drivers: ${driverCount}`);
  console.log(`   🚙 Vehicles: ${vehicleCount}`);
  console.log(`   🛣️  Routes: ${routeCount}`);
  console.log(`   📍 Stops: ${stopCount}`);
  console.log(`   📌 Locations: ${locationCount}`);
  console.log(`   🔔 Notifications: ${notificationCount}\n`);

  const sterling = await prisma.organization.findFirst({
    where: { name: 'Sterling Logistics Solutions' },
    include: {
      members: true,
      _count: {
        select: {
          employees: true,
          locations: true
        }
      }
    }
  });

  if (sterling) {
    console.log('🌟 Sterling Logistics Details:');
    console.log(`   Members: ${sterling.members.length}`);
    console.log(`   Employees: ${sterling._count.employees}`);
    console.log(`   Locations: ${sterling._count.locations}\n`);

    const employeesWithoutLocation = await prisma.employee.count({
      where: {
        organizationId: sterling.id,
        locationId: null
      }
    });

    const employeesWithoutStop = await prisma.employee.count({
      where: {
        organizationId: sterling.id,
        stopId: null
      }
    });

    console.log('   ⚠️  Employees without location:', employeesWithoutLocation);
    console.log('   ⚠️  Employees without stop:', employeesWithoutStop);
  }
}

async function main() {
  console.log('\n');
  console.log('╔' + '═'.repeat(78) + '╗');
  console.log('║' + ' '.repeat(15) + '🚀 MASTER DATABASE SEEDING SCRIPT 🚀' + ' '.repeat(27) + '║');
  console.log('╚' + '═'.repeat(78) + '╝');
  console.log('\n');

  try {
    await cleanDatabase();

    await runCommand(
      'npx prisma migrate reset --force --skip-seed',
      'Step 1: Reset database and run migrations'
    );

    await runCommand(
      'npx tsx src/script/cleanupOrphanedMembers.ts',
      'Step 1.5: Cleanup orphaned members (if any exist)'
    );

    await runCommand(
      'npx tsx src/script/createUsers.ts',
      'Step 2: Create 121 users via Better Auth'
    );

    await runCommand(
      'npx tsx src/script/setupOrganizationsWithAuth.ts',
      'Step 3: Set up 5 organizations with members and roles'
    );

    await runCommand(
      'npx tsx prisma/seed.ts',
      'Step 4: Seed all organizations with fleet data'
    );

    await runCommand(
      'npx tsx src/script/assignDriversToVehicles.ts',
      'Step 4.5: Link drivers with shuttle vehicles'
    );

    await runCommand(
      'npx tsx src/script/createLocationsForEmployees.ts',
      'Step 5: Create locations for employees'
    );

    await runCommand(
      'npx tsx src/script/createStopsForEmployees.ts',
      'Step 6: Create stops for employees'
    );

    await runCommand(
      'npx tsx src/script/addMembersToSterling.ts',
      'Step 7: Add 30 additional employees to Sterling Logistics'
    );

    await runCommand(
      'npx tsx src/script/addLocationsToSterling.ts',
      'Step 8: Assign locations to new Sterling employees'
    );

    await runCommand(
      'npx tsx src/script/addStopsToSterling.ts',
      'Step 9: Create stops for new Sterling employees'
    );

    await runCommand(
      'npx tsx src/script/addEmployeesFromOldSeed.ts',
      'Step 10: Add employees from old seed.ts to Sterling (all in one shift)'
    );

    await runCommand(
      'npx tsx src/script/addSingleLocationToSterling.ts',
      'Step 11: Assign all Sterling employees to single primary location'
    );

    await runCommand(
      'npx tsx src/script/addStopsFromOldSeed.ts',
      'Step 12: Create stops for employees from old seed.ts'
    );

    await verifyData();

    console.log('\n');
    console.log('╔' + '═'.repeat(78) + '╗');
    console.log('║' + ' '.repeat(25) + '✅ ALL STEPS COMPLETED ✅' + ' '.repeat(28) + '║');
    console.log('╚' + '═'.repeat(78) + '╝');
    console.log('\n');

  } catch (error) {
    console.error('\n❌ Master seed failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
