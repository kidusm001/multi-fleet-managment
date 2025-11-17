# Payroll Reports API

## Overview
The Payroll Reports API manages financial reporting, driver compensation tracking, and payroll processing for fleet management operations.

## Base Route
```
/api/payroll-reports
```

## Authentication & Permissions
- All endpoints require authentication
- Superadmin routes require `superadmin` role
- Organization-scoped routes require appropriate payroll and financial permissions

---

## Superadmin Endpoints

### GET /superadmin
**Get all payroll reports across all organizations**

### GET /superadmin/:id
**Get specific payroll report by ID**

### GET /superadmin/by-organization/:organizationId
**Get payroll reports for a specific organization**

### POST /superadmin
**Create a new payroll report**

### PUT /superadmin/:id
**Update a payroll report**

### DELETE /superadmin/:id
**Delete a payroll report**

### GET /superadmin/stats/summary
**Get payroll statistics summary across organizations**

### POST /superadmin/generate-batch
**Generate payroll reports for multiple organizations**

---

## Organization-Scoped Endpoints

### GET /
**Get payroll reports for user's organization**

### GET /:id
**Get specific payroll report**

### POST /
**Create payroll report**

### PUT /:id
**Update payroll report**

### DELETE /:id
**Delete payroll report**

### GET /by-period/:startDate/:endDate
**Get payroll reports for date range**

### GET /by-driver/:driverId
**Get payroll reports for specific driver**

### POST /generate
**Generate payroll report for current period**

### GET /pending
**Get pending payroll reports**

### PATCH /:id/approve
**Approve payroll report**

### PATCH /:id/reject
**Reject payroll report**

### GET /export/:id
**Export payroll report to PDF/Excel**

---

## Payroll Report Model

```typescript
interface PayrollReport {
  id: string;
  driverId: string;
  period: string;
  startDate: Date;
  endDate: Date;
  totalHours: number;
  regularHours: number;
  overtimeHours: number;
  basePay: number;
  overtimePay: number;
  bonuses: number;
  deductions: number;
  grossPay: number;
  netPay: number;
  status: PayrollStatus;
  generatedAt: Date;
  approvedAt?: Date;
  approvedBy?: string;
  paidAt?: Date;
  notes?: string;
  organizationId: string;
  
  // Relations
  driver: User;
  organization: Organization;
  payrollEntries: PayrollEntry[];
}

interface PayrollEntry {
  id: string;
  payrollReportId: string;
  shiftId?: string;
  routeId?: string;
  date: Date;
  hours: number;
  rate: number;
  amount: number;
  type: PayrollEntryType;
  description?: string;
  
  // Relations
  payrollReport: PayrollReport;
  shift?: Shift;
  route?: Route;
}
```

### Payroll Status Values
- `DRAFT` - Report is in draft status
- `PENDING` - Report is pending approval
- `APPROVED` - Report has been approved
- `PAID` - Report has been paid out
- `REJECTED` - Report has been rejected

### Payroll Entry Types
- `REGULAR_HOURS` - Regular working hours
- `OVERTIME_HOURS` - Overtime working hours
- `BONUS` - Performance or other bonuses
- `DEDUCTION` - Deductions from pay
- `MILEAGE` - Mileage compensation
- `ALLOWANCE` - Various allowances

For detailed endpoint documentation, refer to the payroll-reports.ts route file.
