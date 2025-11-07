import { PrismaClient } from './packages/server/node_modules/@prisma/client';

const prisma = new PrismaClient();

async function checkDuplicates() {
  const employees = await prisma.employee.findMany({
    select: { name: true }
  });

  const names = employees.map((e: { name: string }) => e.name);
  const uniqueNames = new Set(names);
  const duplicates = names.filter((name: string) => {
    const count = names.filter((n: string) => n === name).length;
    return count > 1;
  });

  console.log('Total employees:', employees.length);
  console.log('Unique names:', uniqueNames.size);
  console.log('Duplicates found:', duplicates.length);

  if (duplicates.length > 0) {
    console.log('Duplicate names:', [...new Set(duplicates)]);
  } else {
    console.log('✅ SUCCESS: 0% duplicates - all employee names are unique!');
  }

  await prisma.$disconnect();
}

checkDuplicates();