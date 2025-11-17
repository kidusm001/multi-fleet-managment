# Trigger-Based Payroll System Documentation

## Overview

The trigger-based payroll system automates payroll calculation and generation based on daily attendance records. The system supports both in-house drivers (salary/hourly) and outsourced service providers (contract-based).

## Architecture

### Core Components

1. **Attendance Records** (`/api/attendance`)
   - Daily work tracking for vehicles and drivers
   - Captures hours, trips, kilometers, and expenses
   - Foundation data for payroll calculations

2. **Payroll Periods** (`/api/payroll-periods`)
   - Define payroll cycles (monthly, bi-weekly, etc.)
   - Manage payroll entry generation and status
   - Aggregate payments and track processing

3. **Payroll Entries** (managed within periods)
   - Individual payment records for drivers/service providers
   - Calculated from attendance data
   - Support adjustments (bonuses, deductions)

## Data Flow

```
┌─────────────────────┐
│ Daily Attendance    │
│ Records Created     │
│ (Manual/Automated)  │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Payroll Period      │
│ Created for Cycle   │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Trigger: Generate   │
│ Payroll Entries     │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Attendance Records  │
│ Aggregated by:      │
│ - Driver (in-house) │
│ - Service Provider  │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Payment Calculation │
│ - Salary/Hourly     │
│ - Service Fees      │
│ - Expenses          │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Payroll Entries     │
│ Created in DB       │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Review & Adjust     │
│ (Bonuses/Deductions)│
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Approve & Process   │
│ Status: PAID        │
└─────────────────────┘
```

## Payment Calculation Logic

### For In-House Drivers (SALARY type)

**When `driver.baseSalary` is set:**
```typescript
const daysInPeriod = (endDate - startDate) / (1000 * 60 * 60 * 24);
const amount = (driver.baseSalary * daysWorked) / daysInPeriod;
```

**When `driver.hourlyRate` is set:**
```typescript
const amount = driver.hourlyRate * hoursWorked;
```

**Summary Fields:**
- `daysWorked`: Count of attendance records
- `hoursWorked`: Sum of all hours
- `tripsCompleted`: Sum of all trips
- `kmsCovered`: Sum of all kilometers

### For Service Providers (SERVICE_FEE type)

**Priority 1: Monthly Rate (prorated)**
```typescript
if (serviceProvider.monthlyRate) {
  const daysInPeriod = (endDate - startDate) / (1000 * 60 * 60 * 24);
  amount = (serviceProvider.monthlyRate * daysWorked) / daysInPeriod;
}
```

**Priority 2: Per Trip Rate**
```typescript
else if (serviceProvider.perTripRate) {
  amount = serviceProvider.perTripRate * tripsCompleted;
}
```

**Priority 3: Per Kilometer Rate**
```typescript
else if (serviceProvider.perKmRate) {
  amount = serviceProvider.perKmRate * kmsCovered;
}
```

**Priority 4: Daily Rate (from vehicle)**
```typescript
else if (vehicle.dailyRate) {
  amount = vehicle.dailyRate * daysWorked;
}
```

**Add Expenses:**
```typescript
const expenses = fuelCost + tollCost;
const totalAmount = amount + expenses;
```

## Database Schema

### AttendanceRecord
```prisma
model AttendanceRecord {
  id        String   @id @default(cuid())
  driverId  String?  // Null for outsourced
  vehicleId String
  date      DateTime
  
  hoursWorked    Float?
  tripsCompleted Int    @default(0)
  kmsCovered     Float?
  fuelCost       Decimal? @db.Decimal(8, 2)
  tollCost       Decimal? @db.Decimal(8, 2)
  
  organizationId String
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
}
```

### PayrollPeriod
```prisma
model PayrollPeriod {
  id          String        @id @default(cuid())
  name        String
  startDate   DateTime
  endDate     DateTime
  totalAmount Decimal       @db.Decimal(12, 2)
  status      PaymentStatus @default(PENDING)
  
  organizationId String
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
  
  payrollEntries PayrollEntry[]
}
```

### PayrollEntry
```prisma
model PayrollEntry {
  id              String @id @default(cuid())
  payrollPeriodId String
  
  driverId          String?
  serviceProviderId String?
  vehicleId         String?
  
  payrollType PayrollType
  description String?
  
  amount     Decimal @db.Decimal(10, 2)
  bonuses    Decimal @default(0) @db.Decimal(10, 2)
  deductions Decimal @default(0) @db.Decimal(10, 2)
  netPay     Decimal @db.Decimal(10, 2)
  
  daysWorked     Int    @default(0)
  hoursWorked    Float?
  tripsCompleted Int    @default(0)
  kmsCovered     Float?
  
  paymentMethod PaymentMethod @default(BANK_TRANSFER)
  status        PaymentStatus @default(PENDING)
  paidAt        DateTime?
  
  organizationId String
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
}
```

## API Endpoints

### Attendance Management
- `GET /api/attendance` - List records
- `POST /api/attendance` - Create record
- `PUT /api/attendance/:id` - Update record
- `DELETE /api/attendance/:id` - Delete record
- `GET /api/attendance/summary/driver/:driverId` - Driver summary
- `GET /api/attendance/summary/vehicle/:vehicleId` - Vehicle summary
- `POST /api/attendance/bulk` - Bulk create

### Payroll Period Management
- `GET /api/payroll-periods` - List periods
- `POST /api/payroll-periods` - Create period
- `GET /api/payroll-periods/:id` - Get period details
- `POST /api/payroll-periods/:id/generate-entries` - **Trigger generation**
- `PATCH /api/payroll-periods/:id/status` - Update status
- `PATCH /api/payroll-periods/:periodId/entries/:entryId` - Adjust entry
- `DELETE /api/payroll-periods/:id` - Delete period

### Superadmin Endpoints
- `GET /api/attendance/superadmin/all` - All attendance records
- `GET /api/attendance/superadmin/stats` - Attendance statistics
- `GET /api/payroll-periods/superadmin/all` - All payroll periods
- `GET /api/payroll-periods/superadmin/stats` - Payroll statistics

## Usage Examples

### 1. Record Daily Attendance
```bash
# For in-house driver
curl -X POST /api/attendance \
  -H "Content-Type: application/json" \
  -d '{
    "vehicleId": "clxxx",
    "driverId": "clxxx",
    "date": "2024-01-15",
    "hoursWorked": 8.5,
    "tripsCompleted": 12,
    "kmsCovered": 145.5
  }'

# For outsourced vehicle
curl -X POST /api/attendance \
  -H "Content-Type: application/json" \
  -d '{
    "vehicleId": "clxxx",
    "date": "2024-01-15",
    "tripsCompleted": 15,
    "kmsCovered": 180.0,
    "fuelCost": 450.00,
    "tollCost": 60.00
  }'
```

### 2. Create Payroll Period
```bash
curl -X POST /api/payroll-periods \
  -H "Content-Type: application/json" \
  -d '{
    "name": "January 2024",
    "startDate": "2024-01-01",
    "endDate": "2024-01-31"
  }'
```

### 3. Trigger Payroll Generation
```bash
curl -X POST /api/payroll-periods/{periodId}/generate-entries
```

### 4. Review Generated Entries
```bash
curl /api/payroll-periods/{periodId}
```

### 5. Adjust Entry (Add Bonus)
```bash
curl -X PATCH /api/payroll-periods/{periodId}/entries/{entryId} \
  -H "Content-Type: application/json" \
  -d '{
    "bonuses": 500.00
  }'
```

### 6. Process Payroll
```bash
curl -X PATCH /api/payroll-periods/{periodId}/status \
  -H "Content-Type: application/json" \
  -d '{
    "status": "PROCESSED"
  }'
```

### 7. Mark as Paid
```bash
curl -X PATCH /api/payroll-periods/{periodId}/status \
  -H "Content-Type: application/json" \
  -d '{
    "status": "PAID"
  }'
```

## Workflow Steps

### Monthly Payroll Process

1. **Day 1 of Month**: Create new payroll period
   ```bash
   POST /api/payroll-periods
   {
     "name": "February 2024",
     "startDate": "2024-02-01",
     "endDate": "2024-02-29"
   }
   ```

2. **Daily (Throughout Month)**: Record attendance
   - Drivers/supervisors log attendance at end of each day
   - Can be automated via fleet tracking systems
   - Captures work metrics and expenses

3. **End of Month**: Generate payroll entries
   ```bash
   POST /api/payroll-periods/{periodId}/generate-entries
   ```
   - System aggregates all attendance for the period
   - Calculates payments based on contract types
   - Creates individual payroll entries

4. **Review Period**: Adjust entries as needed
   - Add bonuses for performance
   - Apply deductions for penalties
   - Verify calculations

5. **Approval**: Change status to PROCESSED
   ```bash
   PATCH /api/payroll-periods/{periodId}/status
   { "status": "PROCESSED" }
   ```

6. **Payment**: Execute bank transfers, then mark PAID
   ```bash
   PATCH /api/payroll-periods/{periodId}/status
   { "status": "PAID" }
   ```

## Features

### ✅ Automated Calculation
- No manual computation needed
- Based on actual work records
- Supports multiple payment models

### ✅ Flexible Payment Types
- **In-House Drivers**: Salary or hourly
- **Service Providers**: Monthly, per-trip, per-km, or daily rates
- **Expense Reimbursement**: Fuel and tolls included

### ✅ Audit Trail
- All attendance records preserved
- Payroll entries track calculation source
- Status changes logged with timestamps

### ✅ Multi-Organization Support
- Automatic organization filtering
- Isolated data per organization
- Superadmin oversight capabilities

### ✅ Adjustable
- Add bonuses/deductions after generation
- Recalculates net pay automatically
- Updates period totals

### ✅ Status Management
- PENDING: Can be modified
- PROCESSED: Ready for payment
- PAID: Completed (locked)
- CANCELLED: Voided period

## Security & Permissions

### Organization-Scoped
- Users can only access their organization's data
- Automatically filtered by `activeOrganizationId`
- No cross-organization data leakage

### Superadmin
- Full access to all organizations
- Can view statistics across organizations
- Required for global oversight

### Authentication
- Better Auth integration
- Session-based organization context
- Role-based access control

## Error Handling

### Common Errors
- **400**: Invalid date ranges, missing required fields
- **404**: Period/record not found
- **409**: Overlapping periods, duplicate attendance
- **500**: Server errors

### Validation Rules
1. Attendance date must be unique per vehicle
2. Payroll periods cannot overlap
3. Cannot delete PAID periods
4. Period must be PENDING to generate entries
5. Entries must exist to update period status

## Performance Considerations

### Indexing
- `organizationId` indexed on all tables
- `date` indexed on AttendanceRecord
- `startDate, endDate` indexed on PayrollPeriod
- Composite indexes for common queries

### Pagination
- All list endpoints support pagination
- Default limits prevent large data transfers
- Efficient offset-based pagination

### Transactions
- Entry generation uses database transactions
- Ensures data consistency
- Rollback on any failure

## Future Enhancements

### Planned Features
1. **Email Notifications**: Notify recipients when payroll is ready
2. **PDF Reports**: Generate detailed payroll reports
3. **Approval Workflows**: Multi-level approval for large amounts
4. **Bank Integration**: Direct API integration for payments
5. **Tax Calculations**: Automatic tax withholding
6. **Overtime Rules**: Configurable overtime calculations
7. **Recurring Bonuses**: Template-based bonus application
8. **Performance Metrics**: Driver/vehicle performance dashboards

### Integration Points
- Export to accounting systems (QuickBooks, Xero)
- Mobile app for attendance recording
- GPS tracking integration for automatic attendance
- Biometric clock-in/out systems

## Monitoring & Analytics

### Key Metrics
- Total payroll by period
- Driver vs. service provider costs
- Expense trends (fuel, tolls)
- Utilization rates (days worked vs. period length)
- Payment status distribution

### Reports Available
1. Attendance summary by driver
2. Attendance summary by vehicle
3. Payroll period summary
4. Organization-wide statistics
5. Cost breakdown by type

## Support & Documentation

- **API Docs**: `/docs/api/attendance.md`, `/docs/api/payroll-periods.md`
- **Schema**: `/packages/server/prisma/schema.prisma`
- **Routes**: `/packages/server/src/routes/attendance.ts`, `/packages/server/src/routes/payroll-periods.ts`

## Troubleshooting

### No Entries Generated
- **Check**: Do attendance records exist for the period?
- **Check**: Is the period status PENDING?
- **Check**: Are drivers/service providers properly configured with rates?

### Incorrect Calculations
- **Check**: Driver baseSalary/hourlyRate values
- **Check**: Service provider rate configuration
- **Check**: Attendance record accuracy (hours, trips, kms)

### Cannot Update Entry
- **Check**: Is period status PENDING?
- **Check**: Does the entry belong to this period?
- **Check**: User has proper organization access?

---

## Quick Start

1. **Setup**: Ensure drivers and service providers have payment rates configured
2. **Record**: Create attendance records daily
3. **Generate**: At period end, trigger payroll generation
4. **Review**: Check generated entries for accuracy
5. **Adjust**: Add bonuses/deductions as needed
6. **Process**: Mark period as PROCESSED
7. **Pay**: Execute payments and mark PAID

This system provides a robust, automated foundation for payroll management in fleet operations.
