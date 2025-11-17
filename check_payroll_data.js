import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkPayrollData() {
  const orgId = 'hqc5LSA7DMrHrizbAfkU3hCYUL5WQC9c';
  
  console.log('Checking payroll data for organization:', orgId);
  
  // Count total payroll reports
  const totalCount = await prisma.payrollReport.count({
    where: { organizationId: orgId }
  });
  console.log(`\nTotal payroll reports: ${totalCount}`);
  
  if (totalCount > 0) {
    // Get sample reports
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
        vehicleId: true,
      }
    });
    
    console.log('\nSample payroll reports:');
    samples.forEach(report => {
      console.log({
        id: report.id,
        period: report.period,
        payDate: report.payDate,
        createdAt: report.createdAt,
        totalPayment: report.totalPayment.toString(),
      });
    });
    
    // Check date ranges
    const dateRanges = await prisma.$queryRaw`
      SELECT 
        MIN(pay_date) as min_pay_date,
        MAX(pay_date) as max_pay_date,
        MIN(created_at) as min_created_at,
        MAX(created_at) as max_created_at,
        COUNT(*) as total
      FROM payroll_reports
      WHERE organization_id = ${orgId}
    `;
    console.log('\nDate ranges:', dateRanges);
  }
  
  await prisma.$disconnect();
}

checkPayrollData().catch(console.error);
