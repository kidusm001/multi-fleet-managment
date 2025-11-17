import prisma from './src/db.js';

const orgId = 'hqc5LSA7DMrHrizbAfkU3hCYUL5WQC9c';

async function checkData() {
  try {
    const count = await prisma.payrollReport.count({ 
      where: { organizationId: orgId } 
    });
    console.log('Total payroll reports:', count);
    
    if (count > 0) {
      const samples = await prisma.payrollReport.findMany({
        where: { organizationId: orgId },
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: { 
          id: true, 
          period: true, 
          payDate: true, 
          createdAt: true, 
          totalPayment: true,
          driverId: true,
          vehicleId: true
        }
      });
      console.log('\nSample reports:');
      samples.forEach(r => {
        console.log({
          period: r.period,
          payDate: r.payDate?.toISOString(),
          createdAt: r.createdAt.toISOString(),
          totalPayment: r.totalPayment.toString(),
          hasDriver: !!r.driverId,
          hasVehicle: !!r.vehicleId
        });
      });
    }
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkData();
