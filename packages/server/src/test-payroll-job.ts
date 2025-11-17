import dotenv from 'dotenv';
import path from 'path';
import { payrollQueue } from './jobs/payroll/payroll.queue.js';
import { generateMonthlyPayroll } from './jobs/payroll/payroll.jobs.js';
import { closeRedisConnection } from './lib/bullmq.js';

dotenv.config({ path: path.resolve(process.cwd(), '../../.env') });

async function testPayrollGeneration() {
  try {
    console.log('🧪 Testing payroll generation...\n');

    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;

    console.log(`📅 Triggering monthly payroll for ${year}-${month}`);
    
    await generateMonthlyPayroll({ organizationId: '', year, month });
    
    console.log('\n✅ Payroll generation jobs queued successfully');
    
    const jobCounts = await payrollQueue.getJobCounts();
    console.log('\n📊 Queue Status:');
    console.log(`  - Waiting: ${jobCounts.waiting}`);
    console.log(`  - Active: ${jobCounts.active}`);
    console.log(`  - Completed: ${jobCounts.completed}`);
    console.log(`  - Failed: ${jobCounts.failed}`);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await closeRedisConnection();
    console.log('\n👋 Test completed');
    process.exit(0);
  }
}

testPayrollGeneration();
