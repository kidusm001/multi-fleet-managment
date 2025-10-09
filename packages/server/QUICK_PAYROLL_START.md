# Quick Start: BullMQ Payroll Automation

## Prerequisites

1. **Redis** must be running:
   ```bash
   # Check if Redis is running
   redis-cli ping  # Should return "PONG"
   
   # If not installed:
   brew install redis      # macOS
   sudo apt install redis  # Ubuntu/Debian
   
   # Start Redis
   redis-server
   ```

2. **Environment variables** in `.env`:
   ```env
   REDIS_URL="redis://localhost:6379"
   REDIS_ENABLED="true"
   BULLMQ_ENABLED="true"
   PAYROLL_CRON_SCHEDULE="59 23 L * *"
   ```

## Quick Test

```bash
cd packages/server
pnpm tsx src/test-payroll-job.ts
```

Expected output:
```
🧪 Testing payroll generation...
📅 Triggering monthly payroll for 2025-10
✅ BullMQ Redis connected
✅ Queued payroll generation for organization: [Org Name]
📊 Queue Status:
  - Waiting: 0
  - Active: 5
  - Completed: 5
  - Failed: 0
```

## Start Server with Auto-Payroll

```bash
cd packages/server
pnpm dev
```

Look for:
```
✅ BullMQ payroll scheduler initialized
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| `Cannot connect to Redis` | Start Redis: `redis-server` |
| `Redis and BullMQ must be enabled` | Add `BULLMQ_ENABLED=true` to `.env` |
| Jobs not running | Check cron schedule format |
| No entries created | Verify attendance records exist |

## Full Documentation

See `BULLMQ_PAYROLL_SETUP.md` for complete details.
