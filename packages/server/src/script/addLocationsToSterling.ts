import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function addLocationsToSterlingEmployees() {
  const sterling = await prisma.organization.findFirst({
    where: { name: 'Sterling Logistics Solutions' }
  });

  if (!sterling) {
    throw new Error('Sterling Logistics Solutions not found');
  }

  const locations = await prisma.location.findMany({
    where: { organizationId: sterling.id }
  });

  if (locations.length === 0) {
    throw new Error('No locations found for Sterling Logistics');
  }

  const employeesWithoutLocation = await prisma.employee.findMany({
    where: { organizationId: sterling.id, locationId: null },
    include: { user: true }
  });

  console.log(`Assigning locations to ${employeesWithoutLocation.length} employees...`);
  console.log(`Available locations: ${locations.length}\n`);

  for (const emp of employeesWithoutLocation) {
    const randomLocation = locations[Math.floor(Math.random() * locations.length)];

    await prisma.employee.update({
      where: { id: emp.id },
      data: { locationId: randomLocation.id }
    });

    console.log(`✓ Assigned ${emp.user.name} to ${randomLocation.address}`);
  }

  console.log(`\n✅ Done! Assigned ${employeesWithoutLocation.length} employees to locations`);
  await prisma.$disconnect();
}

addLocationsToSterlingEmployees().catch(console.error);
