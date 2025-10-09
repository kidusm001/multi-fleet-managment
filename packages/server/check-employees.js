import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkEmployeeData() {
  try {
    const employees = await prisma.employee.findMany({
      take: 3,
      include: {
        workLocation: true,
        stop: true
      }
    });

    console.log('Sample employees with location data:');
    employees.forEach(emp => {
      console.log(`Employee: ${emp.name}`);
      console.log(`  workLocation: ${emp.workLocation?.address}`);
      console.log(`  stop:`, emp.stop);
      console.log('---');
    });
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkEmployeeData();