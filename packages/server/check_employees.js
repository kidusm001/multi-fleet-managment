import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkEmployees() {
  const orgs = await prisma.organization.findMany({
    include: { _count: { select: { employees: true } } }
  });
  console.log('Current employee counts:');
  orgs.forEach(org => {
    console.log(`${org.name}: ${org._count.employees} employees`);
  });
  await prisma.$disconnect();
}

checkEmployees();