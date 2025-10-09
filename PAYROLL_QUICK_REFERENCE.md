# Payroll System - Quick Reference

## 🚀 Quick Start

### 1. Record Daily Attendance
```bash
POST /api/attendance
{
  "vehicleId": "clxxx",
  "driverId": "clxxx",      # Optional for outsourced
  "date": "2024-01-15",
  "hoursWorked": 8.5,
  "tripsCompleted": 12,
  "kmsCovered": 145.5,
  "fuelCost": 350.00,       # For outsourced
  "tollCost": 50.00         # For outsourced
}
```

### 2. Create Payroll Period
```bash
POST /api/payroll-periods
{
  "name": "January 2024",
  "startDate": "2024-01-01",
  "endDate": "2024-01-31"
}
```

### 3. Generate Payroll (Trigger)
```bash
POST /api/payroll-periods/:id/generate-entries
```

### 4. Review & Adjust
```bash
# View entries
GET /api/payroll-periods/:id

# Adjust entry
PATCH /api/payroll-periods/:periodId/entries/:entryId
{
  "bonuses": 500.00,
  "deductions": 100.00
}
```

### 5. Process & Pay
```bash
# Mark as processed
PATCH /api/payroll-periods/:id/status
{ "status": "PROCESSED" }

# Mark as paid
PATCH /api/payroll-periods/:id/status
{ "status": "PAID" }
```

---

## 📊 Calculation Logic

### In-House Drivers (SALARY)
```typescript
// Salary-based
amount = (driver.baseSalary × daysWorked) / daysInPeriod

// OR Hourly-based
amount = driver.hourlyRate × hoursWorked
```

### Service Providers (SERVICE_FEE)
```typescript
// Priority 1: Monthly rate
amount = (serviceProvider.monthlyRate × daysWorked) / daysInPeriod

// Priority 2: Per trip
amount = serviceProvider.perTripRate × tripsCompleted

// Priority 3: Per kilometer
amount = serviceProvider.perKmRate × kmsCovered

// Priority 4: Daily rate
amount = vehicle.dailyRate × daysWorked

// Add expenses
totalAmount = amount + fuelCost + tollCost
```

---

## 🔗 Key Endpoints

### Attendance
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/attendance` | List all records |
| POST | `/api/attendance` | Create record |
| PUT | `/api/attendance/:id` | Update record |
| DELETE | `/api/attendance/:id` | Delete record |
| GET | `/api/attendance/summary/driver/:id` | Driver summary |
| GET | `/api/attendance/summary/vehicle/:id` | Vehicle summary |
| POST | `/api/attendance/bulk` | Bulk create |

### Payroll Periods
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/payroll-periods` | List all periods |
| POST | `/api/payroll-periods` | Create period |
| GET | `/api/payroll-periods/:id` | Get period details |
| POST | `/api/payroll-periods/:id/generate-entries` | **Generate payroll** |
| PATCH | `/api/payroll-periods/:id/status` | Update status |
| PATCH | `/api/payroll-periods/:periodId/entries/:entryId` | Adjust entry |
| DELETE | `/api/payroll-periods/:id` | Delete period |

---

## 📁 Data Models

### AttendanceRecord
```typescript
{
  id: string;
  driverId?: string;        // Null for outsourced
  vehicleId: string;
  date: Date;
  hoursWorked?: number;
  tripsCompleted: number;
  kmsCovered?: number;
  fuelCost?: Decimal;
  tollCost?: Decimal;
  organizationId: string;
}
```

### PayrollPeriod
```typescript
{
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
  totalAmount: Decimal;
  status: 'PENDING' | 'PROCESSED' | 'CANCELLED' | 'PAID';
  payrollEntries: PayrollEntry[];
}
```

### PayrollEntry
```typescript
{
  id: string;
  payrollPeriodId: string;
  driverId?: string;            // For in-house
  serviceProviderId?: string;   // For outsourced
  vehicleId?: string;
  payrollType: 'SALARY' | 'SERVICE_FEE' | ...;
  amount: Decimal;
  bonuses: Decimal;
  deductions: Decimal;
  netPay: Decimal;              // Auto-calculated
  daysWorked: number;
  hoursWorked?: number;
  tripsCompleted: number;
  kmsCovered?: number;
  paymentMethod: 'BANK_TRANSFER' | 'CASH' | 'CHECK';
  status: 'PENDING' | 'PROCESSED' | 'PAID';
}
```

---

## 🔄 Workflow

```
┌─────────────────┐
│ Daily:          │
│ Record          │
│ Attendance      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Month Start:    │
│ Create Period   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Month End:      │
│ Generate        │
│ Entries         │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Review:         │
│ Adjust Entries  │
│ (Bonus/Deduct)  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Approve:        │
│ Mark PROCESSED  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Pay:            │
│ Mark PAID       │
└─────────────────┘
```

---

## ⚠️ Important Rules

### Validation
- ✅ `vehicleId` and `date` required for attendance
- ✅ No duplicate attendance for same vehicle/date
- ✅ No overlapping payroll periods
- ✅ Period must be PENDING to generate entries
- ✅ Cannot delete PAID periods

### Status Transitions
```
PENDING ──→ PROCESSED ──→ PAID
   ↓
CANCELLED
```

### Calculations
- Net pay = amount + bonuses - deductions
- Period total = sum of all entry netPay
- Auto-recalculated on any change

---

## 🔐 Security

### Organization Scoped
- Automatic filtering by `activeOrganizationId`
- Users see only their organization's data
- Better Auth session-based

### Superadmin
- Access all organizations
- Special `/superadmin/*` endpoints
- Global statistics and oversight

---

## 📝 Common Queries

### Get pending periods
```bash
GET /api/payroll-periods?status=PENDING
```

### Get driver attendance for month
```bash
GET /api/attendance/summary/driver/:driverId?startDate=2024-01-01&endDate=2024-01-31
```

### Get all attendance for period
```bash
GET /api/attendance?startDate=2024-01-01&endDate=2024-01-31&vehicleId=clxxx
```

### Filter by vehicle type
```bash
# Get attendance for in-house vehicles
GET /api/attendance?vehicleId=<in-house-vehicle-id>

# Get attendance for outsourced
GET /api/attendance?vehicleId=<outsourced-vehicle-id>
```

---

## 🐛 Troubleshooting

### No entries generated?
1. Check attendance records exist for period
2. Verify period status is PENDING
3. Ensure drivers/providers have rates configured

### Wrong calculation?
1. Verify driver baseSalary/hourlyRate
2. Check service provider rates
3. Validate attendance data accuracy

### Cannot update entry?
1. Confirm period is PENDING
2. Check entry belongs to period
3. Verify organization access

---

## 📚 Documentation

- **Attendance API**: `/docs/api/attendance.md`
- **Payroll Periods API**: `/docs/api/payroll-periods.md`
- **System Overview**: `/docs/api/payroll-system-overview.md`
- **Implementation Summary**: `/PAYROLL_SYSTEM_COMPLETE.md`

---

## 🎯 Performance Tips

- Use bulk endpoint for mass attendance import
- Paginate large result sets
- Filter by date range to reduce data
- Generate entries only when all attendance recorded
- Process periods in sequence, not parallel

---

## ✨ Features

✅ Automated payroll calculation  
✅ Multiple payment models  
✅ Expense tracking  
✅ Bonus/deduction support  
✅ Status workflow  
✅ Organization isolation  
✅ Audit trail  
✅ Comprehensive summaries  
✅ Bulk operations  
✅ Transaction safety  

---

**Quick Support**: Check `/docs/api/` for detailed documentation
