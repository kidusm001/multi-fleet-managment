import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const orgId = 'hqc5LSA7DMrHrizbAfkU3hCYUL5WQC9c';

async function checkData() {
  try {
    const shifts = await prisma.shift.findMany({ 
      where: { organizationId: orgId }, 
      select: { id: true, name: true } 
    });
    
    const departments = await prisma.department.findMany({ 
      where: { organizationId: orgId }, 
      select: { id: true, name: true } 
    });
    
    const employees = await prisma.employee.findMany({ 
      where: { organizationId: orgId }, 
      select: { id: true, name: true, departmentId: true },
      take: 10
    });
    
    const drivers = await prisma.driver.findMany({ 
      where: { organizationId: orgId }, 
      select: { id: true, name: true },
      take: 10
    });
    
    console.log('\n=== SHIFTS ===');
    console.log(JSON.stringify(shifts, null, 2));
    
    console.log('\n=== DEPARTMENTS ===');
    console.log(JSON.stringify(departments, null, 2));
    
    console.log('\n=== SAMPLE EMPLOYEES ===');
    console.log(JSON.stringify(employees, null, 2));
    
    console.log('\n=== SAMPLE DRIVERS ===');
    console.log(JSON.stringify(drivers, null, 2));
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkData();
