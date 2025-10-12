import { payrollQueue } from './payroll/payroll.queue.js';
import { getPayrollWorker } from './payroll/payroll.worker.js';

export async function scheduleMonthlyPayroll() {
  const cronSchedule = process.env.PAYROLL_CRON_SCHEDULE || '59 23 L * *';

  getPayrollWorker();

  await payrollQueue.add(
    'monthly-payroll-generation',
    {
      organizationId: '',
      year: new Date().getFullYear(),
      month: new Date().getMonth() + 1,
    },
    {
      repeat: {
        pattern: cronSchedule,
      },
    }
  );

  console.log(`✅ Scheduled monthly payroll generation with cron: ${cronSchedule}`);
}

export { payrollQueue };
