import { PrismaClient, LocationType } from '@prisma/client';

const prisma = new PrismaClient();

async function addSingleLocationToSterling() {
  console.log('🏢 Adding single primary location to Sterling Logistics employees...\n');

  try {
    const sterling = await prisma.organization.findFirst({
      where: { slug: 'sterling-logistics' }
    });

    if (!sterling) {
      throw new Error('Sterling Logistics Solutions not found');
    }

    console.log(`✅ Found organization: ${sterling.name} (${sterling.id})\n`);

    // Get or create the primary headquarters location
    let primaryLocation = await prisma.location.findFirst({
      where: {
        organizationId: sterling.id,
        type: LocationType.HQ
      }
    });

    if (!primaryLocation) {
      console.log('📍 Creating primary headquarters location...');
      primaryLocation = await prisma.location.create({
        data: {
          address: 'Bole International Airport Area, Addis Ababa, Ethiopia',
          latitude: 8.9779,
          longitude: 38.7994,
          type: LocationType.HQ,
          organizationId: sterling.id
        }
      });
      console.log(`✅ Created primary location: ${primaryLocation.address}\n`);
    } else {
      console.log(`✅ Using existing primary location: ${primaryLocation.address}\n`);
    }

    // Get all employees without a location
    const employeesWithoutLocation = await prisma.employee.findMany({
      where: {
        organizationId: sterling.id,
        locationId: null
      },
      include: { user: true }
    });

    console.log(`📊 Found ${employeesWithoutLocation.length} employees without location\n`);

    if (employeesWithoutLocation.length === 0) {
      console.log('✅ All employees already have locations assigned!\n');
      return;
    }

    console.log(`🔄 Assigning all employees to primary location...\n`);

    let assignedCount = 0;
    for (const emp of employeesWithoutLocation) {
      await prisma.employee.update({
        where: { id: emp.id },
        data: { locationId: primaryLocation.id }
      });

      console.log(`✓ Assigned ${emp.user?.name || emp.name} to ${primaryLocation.address}`);
      assignedCount++;
    }

    console.log(`\n✅ Done! Assigned ${assignedCount} employees to primary location`);

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

addSingleLocationToSterling().catch(console.error);
