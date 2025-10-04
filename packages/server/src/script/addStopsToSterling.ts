import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function addStopsToSterlingEmployees() {
  const sterling = await prisma.organization.findFirst({
    where: { name: 'Sterling Logistics Solutions' }
  });

  if (!sterling) {
    throw new Error('Sterling Logistics Solutions not found');
  }

  const employeesWithoutStops = await prisma.employee.findMany({
    where: { organizationId: sterling.id, stopId: null },
    include: { user: true }
  });

  console.log(`Creating stops for ${employeesWithoutStops.length} employees...`);

  for (const emp of employeesWithoutStops) {
    const randomStreet = Math.floor(Math.random() * 100);
    const stop = await prisma.stop.create({
      data: {
        name: `${emp.user.name}'s Stop`,
        address: `${randomStreet} Bole Road, Addis Ababa`,
        latitude: 9.0 + Math.random() * 0.1,
        longitude: 38.7 + Math.random() * 0.1,
        organizationId: sterling.id
      }
    });

    await prisma.employee.update({
      where: { id: emp.id },
      data: { stopId: stop.id }
    });

    console.log(`✓ Created stop for ${emp.user.name}`);
  }

  console.log(`\n✅ Done! Created ${employeesWithoutStops.length} stops`);
  await prisma.$disconnect();
}

addStopsToSterlingEmployees().catch(console.error);
