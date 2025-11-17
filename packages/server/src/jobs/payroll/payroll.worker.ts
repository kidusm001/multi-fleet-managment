import { Worker, Job } from 'bullmq';
import { getRedisConnection } from '../../lib/bullmq.js';
import type { MonthlyPayrollJobData, OrganizationPayrollJobData } from './payroll.queue.js';
import { generateMonthlyPayroll, generateOrganizationPayroll } from './payroll.jobs.js';

let workerInstance: Worker<MonthlyPayrollJobData | OrganizationPayrollJobData> | null = null;

export function getPayrollWorker(): Worker<MonthlyPayrollJobData | OrganizationPayrollJobData> {
  if (!workerInstance) {
    workerInstance = new Worker<MonthlyPayrollJobData | OrganizationPayrollJobData>(
      'payroll',
      async (job: Job<MonthlyPayrollJobData | OrganizationPayrollJobData>) => {
        const { name, data } = job;

        console.log(`🔄 Processing payroll job: ${name}`, data);

        try {
          if (name === 'monthly-payroll-generation') {
            await generateMonthlyPayroll(data as MonthlyPayrollJobData);
            console.log(`✅ Monthly payroll generation completed for ${data.year}-${data.month}`);
          } else if (name === 'organization-payroll-generation') {
            await generateOrganizationPayroll(data as OrganizationPayrollJobData);
            console.log(`✅ Organization payroll generation completed for org: ${data.organizationId}`);
          } else {
            throw new Error(`Unknown job type: ${name}`);
          }
        } catch (error) {
          console.error(`❌ Payroll job failed: ${name}`, error);
          throw error;
        }
      },
      {
        connection: getRedisConnection(),
        concurrency: 5,
      }
    );

    workerInstance.on('completed', (job) => {
      console.log(`✅ Job ${job.id} (${job.name}) completed successfully`);
    });

    workerInstance.on('failed', (job, err) => {
      console.error(`❌ Job ${job?.id} (${job?.name}) failed:`, err);
    });

    workerInstance.on('error', (err) => {
      console.error('❌ Payroll worker error:', err);
    });
  }

  return workerInstance;
}

export const payrollWorker = {
  get instance() {
    return getPayrollWorker();
  },
};
