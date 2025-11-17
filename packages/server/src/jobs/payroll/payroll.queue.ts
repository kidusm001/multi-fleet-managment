import { Queue } from 'bullmq';
import { getRedisConnection } from '../../lib/bullmq.js';

export interface MonthlyPayrollJobData {
  organizationId: string;
  year: number;
  month: number;
}

export interface OrganizationPayrollJobData {
  organizationId: string;
  year: number;
  month: number;
}

let queueInstance: Queue<MonthlyPayrollJobData | OrganizationPayrollJobData> | null = null;

export function getPayrollQueue(): Queue<MonthlyPayrollJobData | OrganizationPayrollJobData> {
  if (!queueInstance) {
    queueInstance = new Queue<MonthlyPayrollJobData | OrganizationPayrollJobData>('payroll', {
      connection: getRedisConnection(),
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
        removeOnComplete: {
          age: 24 * 60 * 60,
          count: 100,
        },
        removeOnFail: {
          age: 7 * 24 * 60 * 60,
        },
      },
    });
  }
  return queueInstance;
}

export const payrollQueue = {
  get instance() {
    return getPayrollQueue();
  },
  add: (...args: Parameters<Queue['add']>) => getPayrollQueue().add(...args),
  getJobCounts: () => getPayrollQueue().getJobCounts(),
};
