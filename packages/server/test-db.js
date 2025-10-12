import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testQuery() {
  try {
    console.log('Testing employee query...');
    const employees = await prisma.employee.findMany({
      take: 1,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            createdAt: true
          }
        },
        department: true,
        shift: true,
        workLocation: true,
        stop: true
      }
    });
    console.log('Query successful, found', employees.length, 'employees');
    if (employees.length > 0) {
      console.log('Sample employee:', JSON.stringify(employees[0], null, 2));
    }
  } catch (error) {
    console.error('Query failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testQuery();