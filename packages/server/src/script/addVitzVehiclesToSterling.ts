import { PrismaClient, VehicleStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function addVitzVehiclesToSterling() {
  console.log('🚗 Adding Vitz shuttles to Sterling Logistics...');

  const sterling = await prisma.organization.findFirst({
    where: { name: 'Sterling Logistics Solutions' },
    include: {
      vehicleCategories: true
    }
  });

  if (!sterling) {
    console.log('❌ Sterling Logistics Solutions not found');
    return;
  }

  // Find the 4-seat vehicle category
  const fourSeatCategory = sterling.vehicleCategories.find(cat => cat.capacity === 4);
  if (!fourSeatCategory) {
    console.log('❌ 4-seat vehicle category not found for Sterling');
    return;
  }

  const vitzVehicles = [
    {
      name: 'Vitz Shuttle V1',
      plateNumber: 'VTZ-001-STL',
      model: 'Toyota Vitz',
      make: 'Toyota',
      year: 2023,
      capacity: 4,
      status: VehicleStatus.AVAILABLE,
      categoryId: fourSeatCategory.id,
      organizationId: sterling.id
    },
    {
      name: 'Vitz Shuttle V2',
      plateNumber: 'VTZ-002-STL',
      model: 'Toyota Vitz',
      make: 'Toyota',
      year: 2023,
      capacity: 4,
      status: VehicleStatus.AVAILABLE,
      categoryId: fourSeatCategory.id,
      organizationId: sterling.id
    },
    {
      name: 'Vitz Shuttle V3',
      plateNumber: 'VTZ-003-STL',
      model: 'Toyota Vitz',
      make: 'Toyota',
      year: 2023,
      capacity: 4,
      status: VehicleStatus.AVAILABLE,
      categoryId: fourSeatCategory.id,
      organizationId: sterling.id
    }
  ];

  let created = 0;
  for (const vehicleData of vitzVehicles) {
    try {
      await prisma.vehicle.create({
        data: vehicleData
      });
      created++;
      console.log(`   ✅ Created ${vehicleData.name}`);
    } catch (error) {
      console.log(`   ❌ Failed to create ${vehicleData.name}: ${error}`);
    }
  }

  console.log(`✅ Added ${created} Vitz shuttles to Sterling Logistics`);
}

addVitzVehiclesToSterling()
  .catch(console.error)
  .finally(() => prisma.$disconnect());