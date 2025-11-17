// Script to find Robert Johnson and fix the driver assignments
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function fixDriverAssignments() {
  const vehicleId = 'cmhouw5jz00o5gjrfam0hz79v';
  const wrongDriverId = 'cmhouw5js00ntgjrfohdnicuy'; // David Wilson
  const organizationId = 'hqc5LSA7DMrHrizbAfkU3hCYUL5WQC9c';
  
  // Find Robert Johnson
  console.log('Looking for Robert Johnson...');
  const robertJohnson = await prisma.driver.findFirst({
    where: {
      name: {
        contains: 'Robert',
        mode: 'insensitive'
      },
      organizationId
    }
  });
  
  if (!robertJohnson) {
    console.log('Could not find Robert Johnson. Listing all drivers:');
    const allDrivers = await prisma.driver.findMany({
      where: { organizationId },
      select: {
        id: true,
        name: true,
        assignedVehicleId: true
      }
    });
    allDrivers.forEach(d => {
      console.log(`- ${d.name} (ID: ${d.id}, Vehicle: ${d.assignedVehicleId})`);
    });
    await prisma.$disconnect();
    return;
  }
  
  console.log('\nFound Robert Johnson:');
  console.log(`  ID: ${robertJohnson.id}`);
  console.log(`  Name: ${robertJohnson.name}`);
  console.log(`  Assigned Vehicle: ${robertJohnson.assignedVehicleId}`);
  
  // Check if vehicle assignment is correct
  if (robertJohnson.assignedVehicleId !== vehicleId) {
    console.log(`\n⚠️  WARNING: Robert Johnson is assigned to vehicle ${robertJohnson.assignedVehicleId}, not ${vehicleId}`);
  }
  
  // Find the wrong completions
  const wrongCompletions = await prisma.routeCompletion.findMany({
    where: {
      vehicleId,
      organizationId,
      driverId: wrongDriverId,
      completedAt: {
        gte: new Date('2025-11-07T00:00:00Z'),
        lte: new Date('2025-11-07T23:59:59Z')
      }
    }
  });
  
  console.log(`\n\nFound ${wrongCompletions.length} completions with wrong driver (David Wilson)`);
  
  if (wrongCompletions.length > 0) {
    console.log('\nWould you like to update these to Robert Johnson?');
    console.log('Completions to update:');
    wrongCompletions.forEach((c, i) => {
      console.log(`  ${i + 1}. ${c.id} - completed at ${c.completedAt}`);
    });
    
    console.log('\n\nTo update, run this command:');
    console.log(`\nconst result = await prisma.routeCompletion.updateMany({
  where: {
    id: { in: ${JSON.stringify(wrongCompletions.map(c => c.id))} }
  },
  data: {
    driverId: '${robertJohnson.id}'
  }
});
console.log('Updated', result.count, 'completions');`);
  }
  
  await prisma.$disconnect();
}

fixDriverAssignments().catch(console.error);
