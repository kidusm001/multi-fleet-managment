# BullMQ Payroll Automation Setup

## Overview

This implementation adds **automatic monthly payroll generation** using BullMQ job scheduling. The system automatically generates payroll periods and entries for all organizations at the end of each month.

## Architecture

### Components

1. **`src/lib/bullmq.ts`** - Redis connection management for BullMQ
2. **`src/jobs/payroll/payroll.queue.ts`** - Queue configuration and job data types
3. **`src/jobs/payroll/payroll.worker.ts`** - Worker that processes payroll jobs
4. **`src/jobs/payroll/payroll.jobs.ts`** - Business logic for payroll generation
5. **`src/jobs/index.ts`** - Main entry point for job scheduling
6. **`src/index.ts`** - Server integration (starts workers on server startup)

### Job Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    Monthly Cron Trigger                      │
│              (59 23 L * * - Last day at 11:59 PM)            │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│            generateMonthlyPayroll Job                        │
│  - Fetches all organizations from database                   │
│  - Queues individual organization payroll jobs               │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│       generateOrganizationPayroll Job (per org)              │
│  1. Create PayrollPeriod for the month                       │
│  2. Fetch attendance records for the period                  │
│  3. Group by drivers (IN_HOUSE) and service providers        │
│  4. Calculate salary/fees with bonuses and deductions        │
│  5. Create PayrollEntry records                              │
│  6. Update PayrollPeriod total amount                        │
└─────────────────────────────────────────────────────────────┘
```

## Environment Variables

Add to your `.env` file:

```env
# Redis (required for BullMQ)
REDIS_URL="redis://localhost:6379"
REDIS_ENABLED="true"

# BullMQ Configuration
BULLMQ_ENABLED="true"
PAYROLL_CRON_SCHEDULE="59 23 L * *"  # Last day of month at 11:59 PM
```

### Cron Schedule Format

- `59 23 L * *` - Last day of month at 11:59 PM (default)
- `0 0 1 * *` - First day of month at midnight
- `0 9 * * MON` - Every Monday at 9 AM

**Important**: The `L` (last day) syntax requires BullMQ's cron parser.

## Installation

Dependencies are already installed:
- `bullmq@^5.31.3` - Job queue library
- `ioredis@^5.4.2` - Redis client

## Usage

### Automatic Mode (Recommended)

The payroll job is automatically scheduled when the server starts if `BULLMQ_ENABLED=true`.

```bash
# Start the server
pnpm dev
```

### Manual Testing

Run a one-time payroll generation for testing:

```bash
cd packages/server
REDIS_ENABLED=true BULLMQ_ENABLED=true pnpm tsx src/test-payroll-job.ts
```

Or if you have `.env` configured:

```bash
cd packages/server
pnpm tsx src/test-payroll-job.ts
```

This will:
1. Generate payroll for the current month
2. Queue jobs for all organizations
3. Display job queue statistics

### Monitoring Jobs

You can add **Bull Board** (optional) for a web UI to monitor jobs:

```bash
pnpm add @bull-board/express @bull-board/api
```

Then add to `src/app.ts`:

```typescript
import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';
import { payrollQueue } from './jobs/index.js';

const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath('/admin/queues');

createBullBoard({
  queues: [new BullMQAdapter(payrollQueue)],
  serverAdapter,
});

app.use('/admin/queues', serverAdapter.getRouter());
```

Access at: `http://localhost:3001/admin/queues`

## Payroll Calculation Logic

### For Drivers (IN_HOUSE vehicles)

**Base Pay:**
- Monthly salary (`baseSalary`) if specified
- OR Hourly rate × hours worked (up to 160h/month)

**Overtime:**
- Hours beyond 160/month × `hourlyRate` × `overtimeRate` (default 1.5x)

**Bonuses:**
- Performance: $5 per trip above 50 trips
- Punctuality: $100 if 95%+ attendance (22 working days)
- Fuel efficiency: $50 if avg > 10 km/hour

**Deductions:**
- Tax: 10% of gross pay (TDS)
- Late penalties: $20 per day with <8 hours worked

### For Service Providers (OUTSOURCED vehicles)

**Base Amount:**
1. `monthlyRate` if specified
2. OR `perKmRate` × km covered
3. OR `perTripRate` × trips completed
4. OR `dailyRate` × days worked
5. PLUS fuel and toll costs

**Bonuses:**
- Service quality: $500 if >200 trips completed
- Additional per-km/per-trip rates (if `monthlyRate` exists)

**Deductions:**
- Tax: 2% of gross pay (TDS)
- Performance penalty: $500 if avg trips per vehicle < 20

## Job Configuration

### Queue Options

- **Attempts**: 3 retries on failure
- **Backoff**: Exponential (5s, 10s, 20s)
- **Retention**: Completed jobs kept for 24h, failed jobs for 7 days
- **Concurrency**: Process 5 jobs simultaneously

### Worker Events

The worker emits events for monitoring:

```typescript
payrollWorker.on('completed', (job) => {
  console.log(`✅ Job ${job.id} completed`);
});

payrollWorker.on('failed', (job, err) => {
  console.error(`❌ Job ${job.id} failed:`, err);
});
```

## Disabling BullMQ

To run the server without BullMQ (e.g., in development):

```env
BULLMQ_ENABLED="false"
```

Or simply don't set the variable - the server will skip job initialization.

## Troubleshooting

### Redis Connection Issues

If you see `Redis connection error`:

1. Ensure Redis is running: `redis-cli ping` (should return `PONG`)
2. Check `REDIS_URL` in `.env`
3. Install Redis: `brew install redis` (macOS) or `sudo apt install redis` (Linux)

### Job Not Running

1. Check BullMQ is enabled: `BULLMQ_ENABLED=true`
2. Verify cron schedule is valid
3. Check server logs for queue initialization messages
4. Manually trigger test: `tsx src/test-payroll-job.ts`

### No Payroll Entries Created

This is expected if:
- No attendance records exist for the period
- Organization has no drivers or service providers
- Payroll period already exists for the month

Check logs for specific warnings.

## Future Enhancements

- [ ] Add Bull Board UI for job monitoring
- [ ] Send email notifications when payroll is generated
- [ ] Add Slack/Teams webhooks for alerts
- [ ] Implement job result persistence for audit logs
- [ ] Add manual payroll trigger API endpoint
- [ ] Support custom payroll schedules per organization
- [ ] Add retry logic for specific failure types

## API Integration

While jobs run automatically, you can still manually trigger payroll via the existing API:

```
POST /api/payroll-periods
POST /api/payroll-periods/:id/generate-entries
```

The BullMQ implementation **does not replace** the manual API - it adds automated scheduling on top.
