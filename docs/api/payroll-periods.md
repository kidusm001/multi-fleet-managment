# Payroll Periods API

## Overview
The Payroll Periods API manages payroll cycles and automatically generates payroll entries from attendance records. It implements a trigger-based system that calculates payments for both in-house drivers (salary-based) and service providers (outsourced vehicles).

## Base Route
`/api/payroll-periods`

## Authentication & Permissions
All endpoints require authentication via Better Auth. Organization-scoped endpoints automatically filter data by the user's active organization.

---

## Organization-Scoped Endpoints

### GET /
**Get all payroll periods for user's organization**

**Query Parameters:**
- `status` (optional): Filter by status (PENDING, PROCESSED, CANCELLED, PAID)
- `page` (optional, default: 1): Page number
- `limit` (optional, default: 20): Records per page

**Response:**
```json
{
  "periods": [
    {
      "id": "clxxx",
      "name": "January 2024",
      "startDate": "2024-01-01T00:00:00.000Z",
      "endDate": "2024-01-31T23:59:59.999Z",
      "totalAmount": 125000.00,
      "status": "PAID",
      "payrollEntries": [
        {
          "id": "clxxx",
          "payrollType": "SALARY",
          "amount": 5000.00,
          "netPay": 4800.00,
          "status": "PAID"
        }
      ],
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-02-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 12,
    "totalPages": 1
  }
}
```

---

### GET /:id
**Get specific payroll period with all entries**

**Response:**
```json
{
  "id": "clxxx",
  "name": "January 2024",
  "startDate": "2024-01-01T00:00:00.000Z",
  "endDate": "2024-01-31T23:59:59.999Z",
  "totalAmount": 125000.00,
  "status": "PROCESSED",
  "payrollEntries": [
    {
      "id": "clxxx",
      "payrollType": "SALARY",
      "description": "Salary for 22 days worked",
      "amount": 5000.00,
      "bonuses": 500.00,
      "deductions": 200.00,
      "netPay": 5300.00,
      "daysWorked": 22,
      "hoursWorked": 176.0,
      "tripsCompleted": 264,
      "kmsCovered": 3190.5,
      "paymentMethod": "BANK_TRANSFER",
      "status": "PENDING",
      "driver": {
        "id": "clxxx",
        "name": "John Doe",
        "email": "john@example.com",
        "baseSalary": 5000.00,
        "hourlyRate": 25.00,
        "bankAccountNumber": "1234567890",
        "bankName": "Commercial Bank"
      },
      "vehicle": {
        "id": "clxxx",
        "model": "Toyota Hiace",
        "plateNumber": "AA-12345",
        "type": "IN_HOUSE"
      }
    },
    {
      "id": "clxxx",
      "payrollType": "SERVICE_FEE",
      "description": "Service fee for 20 days + expenses",
      "amount": 12400.00,
      "bonuses": 0.00,
      "deductions": 0.00,
      "netPay": 12400.00,
      "daysWorked": 20,
      "tripsCompleted": 240,
      "kmsCovered": 2800.0,
      "paymentMethod": "BANK_TRANSFER",
      "status": "PENDING",
      "serviceProvider": {
        "id": "clxxx",
        "companyName": "ABC Transport",
        "email": "abc@example.com",
        "monthlyRate": 10000.00,
        "bankAccountNumber": "9876543210",
        "bankName": "Bank of Ethiopia"
      },
      "vehicle": {
        "id": "clxxx",
        "model": "Mercedes Sprinter",
        "plateNumber": "AA-99999",
        "type": "OUTSOURCED"
      }
    }
  ],
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-31T00:00:00.000Z"
}
```

---

### POST /
**Create payroll period**

**Request Body:**
```json
{
  "name": "February 2024",
  "startDate": "2024-02-01",
  "endDate": "2024-02-29"
}
```

**Response:** Returns the created payroll period (201)

**Validations:**
- `name`, `startDate`, and `endDate` are required
- `startDate` must be before `endDate`
- No overlapping periods allowed

---

### POST /:id/generate-entries
**Generate payroll entries from attendance records**

This is the core automation endpoint that:
1. Fetches all attendance records for the period
2. Groups by driver (in-house) and service provider (outsourced)
3. Calculates payments based on:
   - **Drivers**: baseSalary (prorated) or hourlyRate × hours
   - **Service Providers**: monthlyRate (prorated), perTripRate × trips, or perKmRate × kms
4. Includes fuel and toll expenses for outsourced vehicles
5. Creates payroll entries in a transaction
6. Updates period total amount

**Response:**
```json
{
  "message": "Generated 45 payroll entries",
  "entries": [...]
}
```

**Business Logic:**

**For In-House Drivers (SALARY type):**
- If `driver.baseSalary` exists: `(baseSalary × daysWorked) / daysInPeriod`
- Else if `driver.hourlyRate` exists: `hourlyRate × hoursWorked`

**For Service Providers (SERVICE_FEE type):**
- If `serviceProvider.monthlyRate` exists: `(monthlyRate × daysWorked) / daysInPeriod`
- Else if `serviceProvider.perTripRate` exists: `perTripRate × tripsCompleted`
- Else if `serviceProvider.perKmRate` exists: `perKmRate × kmsCovered`
- Else if `vehicle.dailyRate` exists: `dailyRate × daysWorked`
- Plus: `fuelCost + tollCost` from attendance records

**Validation:**
- Period must be in PENDING status
- At least one attendance record must exist for the period

---

### PATCH /:id/status
**Update payroll period status**

**Request Body:**
```json
{
  "status": "PROCESSED"
}
```

**Valid Status Values:**
- `PENDING`: Initial state, entries can be modified
- `PROCESSED`: Calculations complete, ready for approval
- `PAID`: Payments completed
- `CANCELLED`: Period cancelled

**Response:** Returns the updated payroll period

---

### PATCH /:periodId/entries/:entryId
**Update payroll entry**

**Request Body:**
```json
{
  "amount": 5500.00,
  "bonuses": 500.00,
  "deductions": 200.00,
  "status": "PROCESSED"
}
```

**Response:** Returns the updated entry

**Auto-calculations:**
- `netPay` is automatically recalculated as: `amount + bonuses - deductions`
- Period `totalAmount` is recalculated from all entries

---

### DELETE /:id
**Delete payroll period and all entries**

**Restrictions:**
- Cannot delete periods with status PAID

**Response:**
```json
{
  "message": "Payroll period deleted successfully"
}
```

---

## Superadmin Endpoints

### GET /superadmin/all
**Get all payroll periods (superadmin only)**

**Query Parameters:**
- `organizationId` (optional): Filter by organization
- `status` (optional): Filter by status
- `page` (optional, default: 1)
- `limit` (optional, default: 50)

**Response:**
```json
{
  "periods": [
    {
      "id": "clxxx",
      "organization": {
        "id": "clxxx",
        "name": "Acme Transport"
      },
      "name": "January 2024",
      "totalAmount": 125000.00,
      "status": "PAID",
      "payrollEntries": [...]
    }
  ],
  "pagination": {...}
}
```

---

### GET /superadmin/stats
**Get payroll statistics (superadmin only)**

**Query Parameters:**
- `organizationId` (optional): Filter by organization
- `startDate` (optional): Filter from this date
- `endDate` (optional): Filter until this date

**Response:**
```json
{
  "totalPeriods": 48,
  "totalAmount": 6000000.00,
  "pendingPeriods": 2,
  "processedPeriods": 4,
  "paidPeriods": 42,
  "totalEntries": 2160,
  "driverEntries": 1440,
  "serviceProviderEntries": 720
}
```

---

## Data Models

### PayrollPeriod
```typescript
interface PayrollPeriod {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
  totalAmount: Decimal;
  status: PaymentStatus;  // PENDING, PROCESSED, CANCELLED, PAID
  organizationId: string;
  createdAt: Date;
  updatedAt: Date;
  
  // Relations
  organization: Organization;
  payrollEntries: PayrollEntry[];
}
```

### PayrollEntry
```typescript
interface PayrollEntry {
  id: string;
  payrollPeriodId: string;
  driverId?: string;  // For in-house drivers
  serviceProviderId?: string;  // For outsourced vehicles
  vehicleId?: string;
  payrollType: PayrollType;  // SALARY, SERVICE_FEE, OVERTIME, BONUS, etc.
  description?: string;
  amount: Decimal;
  bonuses: Decimal;
  deductions: Decimal;
  netPay: Decimal;
  daysWorked: number;
  hoursWorked?: number;
  tripsCompleted: number;
  kmsCovered?: number;
  paymentMethod: PaymentMethod;  // BANK_TRANSFER, CASH, CHECK
  status: PaymentStatus;
  paidAt?: Date;
  organizationId: string;
  createdAt: Date;
  updatedAt: Date;
  
  // Relations
  payrollPeriod: PayrollPeriod;
  driver?: Driver;
  serviceProvider?: ServiceProvider;
  vehicle?: Vehicle;
}
```

---

## Workflow

### 1. Create Period
```bash
POST /api/payroll-periods
{
  "name": "January 2024",
  "startDate": "2024-01-01",
  "endDate": "2024-01-31"
}
```

### 2. Record Daily Attendance
```bash
POST /api/attendance
{
  "vehicleId": "clxxx",
  "driverId": "clxxx",
  "date": "2024-01-15",
  "hoursWorked": 8.5,
  "tripsCompleted": 12,
  "kmsCovered": 145.5
}
```

### 3. Generate Payroll Entries (Trigger-Based)
```bash
POST /api/payroll-periods/:id/generate-entries
```

This automatically:
- Aggregates attendance records
- Calculates payments per driver/service provider
- Creates payroll entries
- Updates period total

### 4. Review & Adjust
```bash
PATCH /api/payroll-periods/:periodId/entries/:entryId
{
  "bonuses": 500.00,
  "deductions": 100.00
}
```

### 5. Approve Period
```bash
PATCH /api/payroll-periods/:id/status
{
  "status": "PROCESSED"
}
```

### 6. Mark as Paid
```bash
PATCH /api/payroll-periods/:id/status
{
  "status": "PAID"
}
```

---

## Error Codes

- **400**: Bad request (invalid dates, missing fields)
- **404**: Period/entry not found
- **409**: Overlapping period exists
- **500**: Server error

---

## Best Practices

1. **Create periods at the start of each cycle** (monthly, bi-weekly, etc.)
2. **Record attendance daily** to ensure accurate data
3. **Generate entries at period end** when all attendance is recorded
4. **Review and adjust** entries before processing
5. **Lock periods** by changing status to PROCESSED/PAID
6. **Never delete PAID periods** - maintain audit trail
