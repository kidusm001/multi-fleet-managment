import { PrismaClient, VehicleStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function assignDriversToVehicles() {
  const organizations = await prisma.organization.findMany({
    include: {
      drivers: {
        where: {
          deleted: false,
          isActive: true
        },
        orderBy: {
          createdAt: 'asc'
        }
      },
      vehicles: {
        where: {
          deleted: false,
          status: {
            in: [VehicleStatus.AVAILABLE, VehicleStatus.INACTIVE, VehicleStatus.MAINTENANCE]
          }
        },
        orderBy: {
          createdAt: 'asc'
        }
      }
    }
  });

  for (const org of organizations) {
    const drivers = org.drivers;
    if (!drivers.length) {
      console.log(`⚠️  Skipping ${org.name} - no active drivers`);
      continue;
    }

    const vehiclesNeedingAssignment = org.vehicles.filter(vehicle => vehicle.status === VehicleStatus.AVAILABLE && !vehicle.driverId);

    if (!vehiclesNeedingAssignment.length) {
      console.log(`ℹ️  ${org.name} already has drivers assigned to available vehicles`);
      continue;
    }

    let assignments = 0;
    for (let index = 0; index < vehiclesNeedingAssignment.length; index++) {
      const vehicle = vehiclesNeedingAssignment[index];
      const driver = drivers[index % drivers.length];

      await prisma.vehicle.update({
        where: { id: vehicle.id },
        data: { driverId: driver.id }
      });

      await prisma.vehicleAvailability.updateMany({
        where: { vehicleId: vehicle.id },
        data: { driverId: driver.id }
      });

      assignments += 1;
    }

    console.log(`✅ Assigned ${assignments} vehicle(s) to drivers for ${org.name}`);
  }
}

async function main() {
  console.log('🔄 Ensuring drivers are linked to shuttle vehicles...');

  try {
    await assignDriversToVehicles();
    console.log('🎉 Driver to shuttle assignment complete!');
  } catch (error) {
    console.error('❌ Failed to assign drivers to vehicles:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
