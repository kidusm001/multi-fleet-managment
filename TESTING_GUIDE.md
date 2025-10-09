# Testing the Attendance + Payroll System

## 🚀 Quick Test Guide

This guide will help you test the complete attendance and payroll system end-to-end.

---

## 📋 Prerequisites

1. **Database Setup**
   ```bash
   cd packages/server
   npx prisma migrate dev
   npx prisma generate
   ```

2. **Environment Variables**
   ```bash
   DATABASE_URL="postgresql://user:password@localhost:5432/multifleet"
   ```

3. **Start Server**
   ```bash
   pnpm dev
   ```

---

## 🧪 Manual Testing with cURL

### 1. Authenticate and Get Session Cookie

First, you need to sign in and get a session cookie:

```bash
# Sign in and save the session
curl -c cookies.txt -X POST http://localhost:3000/api/auth/sign-in/email \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your-email@example.com",
    "password": "your-password"
  }'

# Now all subsequent requests use the cookie file
export COOKIE_FILE="cookies.txt"
```

Or use the provided script:
```bash
cd packages/server
npx tsx src/script/http-auth.ts
# This saves the session to http-auth-session.json
```

### 2. Create Test Data

#### Create a Driver
```bash
curl -b cookies.txt -X POST http://localhost:3000/api/drivers/superadmin \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "licenseNumber": "DL123456",
    "phoneNumber": "+1234567890",
    "baseSalary": 5000,
    "hourlyRate": 30,
    "overtimeRate": 1.5,
    "bankAccountNumber": "1234567890",
    "bankName": "Test Bank"
  }'
```

#### Create a Vehicle
```bash
curl -b cookies.txt -X POST http://localhost:3000/api/shuttles/superadmin \
  -H "Content-Type: application/json" \
  -d '{
    "plateNumber": "AA-12345",
    "model": "Toyota Hiace",
    "make": "Toyota",
    "type": "IN_HOUSE",
    "capacity": 14,
    "year": 2023,
    "status": "AVAILABLE",
    "dailyRate": 300
  }'
```

#### Create a Service Provider
```bash
curl -b cookies.txt -X POST http://localhost:3000/api/service-providers \
  -H "Content-Type: application/json" \
  -d '{
    "companyName": "ABC Transport",
    "contactPerson": "Jane Smith",
    "email": "abc@transport.com",
    "phoneNumber": "+0987654321",
    "monthlyRate": 10000,
    "perTripRate": 5,
    "perKmRate": 2.5,
    "gstNumber": "29AABCT1234F1Z5",
    "bankAccountNumber": "9876543210",
    "bankName": "Service Bank"
  }'
```

#### Create Outsourced Vehicle
```bash
curl -b cookies.txt -X POST http://localhost:3000/api/shuttles/superadmin \
  -H "Content-Type: application/json" \
  -d '{
    "plateNumber": "BB-99999",
    "model": "Mercedes Sprinter",
    "type": "OUTSOURCED",
    "capacity": 16,
    "dailyRate": 400,
    "serviceProviderId": "<service-provider-id>"
  }'
```

---

### 3. Test Attendance Recording

#### Record Daily Attendance (In-House Driver)
```bash
curl -b cookies.txt -X POST http://localhost:3000/api/attendance \
  -H "Content-Type: application/json" \
  -d '{
    "vehicleId": "<vehicle-id>",
    "driverId": "<driver-id>",
    "date": "2024-01-15",
    "hoursWorked": 9.5,
    "tripsCompleted": 65,
    "kmsCovered": 1900
  }'
```

#### Record Attendance (Outsourced Vehicle)
```bash
curl -b cookies.txt -X POST http://localhost:3000/api/attendance \
  -H "Content-Type: application/json" \
  -d '{
    "vehicleId": "<outsourced-vehicle-id>",
    "date": "2024-01-15",
    "tripsCompleted": 250,
    "kmsCovered": 3500,
    "fuelCost": 1200,
    "tollCost": 300
  }'
```

#### Bulk Create Attendance (Month of January)
```bash
curl -b cookies.txt -X POST http://localhost:3000/api/attendance/bulk \
  -H "Content-Type: application/json" \
  -d '{
    "records": [
      {
        "vehicleId": "<vehicle-id>",
        "driverId": "<driver-id>",
        "date": "2024-01-01",
        "hoursWorked": 180,
        "tripsCompleted": 65,
        "kmsCovered": 1900
      },
      {
        "vehicleId": "<vehicle-id>",
        "driverId": "<driver-id>",
        "date": "2024-01-02",
        "hoursWorked": 8,
        "tripsCompleted": 12,
        "kmsCovered": 150
      }
      // Add more days...
    ]
  }'
```

#### Get Driver Summary
```bash
curl -b cookies.txt "http://localhost:3000/api/attendance/summary/driver/<driver-id>?startDate=2024-01-01&endDate=2024-01-31"
```

Expected Response:
```json
{
  "driverId": "...",
  "period": {
    "startDate": "2024-01-01",
    "endDate": "2024-01-31"
  },
  "summary": {
    "totalDays": 22,
    "totalHours": 180,
    "totalTrips": 264,
    "totalKms": 3190.5,
    "totalFuelCost": 0,
    "totalTollCost": 0
  },
  "records": [...]
}
```

---

### 4. Test Payroll Period Creation

#### Create Payroll Period
```bash
curl -b cookies.txt -X POST http://localhost:3000/api/payroll-periods \
  -H "Content-Type: application/json" \
  -d '{
    "name": "January 2024",
    "startDate": "2024-01-01",
    "endDate": "2024-01-31"
  }'
```

Expected Response:
```json
{
  "id": "period-xxx",
  "name": "January 2024",
  "startDate": "2024-01-01T00:00:00.000Z",
  "endDate": "2024-01-31T23:59:59.999Z",
  "totalAmount": 0,
  "status": "PENDING",
  "organizationId": "...",
  "createdAt": "...",
  "updatedAt": "..."
}
```

---

### 5. Test Payroll Generation (The Magic! ✨)

#### Generate Payroll Entries from Attendance
```bash
curl -b cookies.txt -X POST http://localhost:3000/api/payroll-periods/<period-id>/generate-entries
```

Expected Response:
```json
{
  "message": "Generated 2 payroll entries",
  "entries": [
    {
      "id": "entry-1",
      "driverId": "driver-1",
      "payrollType": "SALARY",
      "amount": 5900.00,
      "bonuses": 225.00,
      "deductions": 612.50,
      "netPay": 5512.50,
      "daysWorked": 21,
      "hoursWorked": 180,
      "tripsCompleted": 65,
      "kmsCovered": 1900
    },
    {
      "id": "entry-2",
      "serviceProviderId": "sp-1",
      "payrollType": "SERVICE_FEE",
      "amount": 11500.00,
      "bonuses": 1750.00,
      "deductions": 265.00,
      "netPay": 12985.00,
      "daysWorked": 25,
      "tripsCompleted": 250,
      "kmsCovered": 3500
    }
  ]
}
```

#### Get Payroll Period Details
```bash
curl -b cookies.txt "http://localhost:3000/api/payroll-periods/<period-id>"
```

---

### 6. Test Entry Adjustments

#### Add Bonus to Entry
```bash
curl -b cookies.txt -X PATCH http://localhost:3000/api/payroll-periods/<period-id>/entries/<entry-id> \
  -H "Content-Type: application/json" \
  -d '{
    "bonuses": 1000
  }'
```

#### Add Deduction to Entry
```bash
curl -b cookies.txt -X PATCH http://localhost:3000/api/payroll-periods/<period-id>/entries/<entry-id> \
  -H "Content-Type: application/json" \
  -d '{
    "deductions": 200
  }'
```

---

### 7. Test Status Workflow

#### Mark as Processed
```bash
curl -b cookies.txt -X PATCH http://localhost:3000/api/payroll-periods/<period-id>/status \
  -H "Content-Type: application/json" \
  -d '{
    "status": "PROCESSED"
  }'
```

#### Mark as Paid
```bash
curl -b cookies.txt -X PATCH http://localhost:3000/api/payroll-periods/<period-id>/status \
  -H "Content-Type: application/json" \
  -d '{
    "status": "PAID"
  }'
```

---

## 🧪 Automated Tests

### Run Unit Tests
```bash
cd packages/server
pnpm test src/routes/__tests__/attendance.test.ts
pnpm test src/routes/__tests__/payroll-periods.test.ts
```

### Run All Tests
```bash
pnpm test
```

---

## ✅ Verification Checklist

### Attendance Tests
- [ ] Create attendance record with driver
- [ ] Create attendance record without driver (outsourced)
- [ ] Reject duplicate attendance
- [ ] Bulk create attendance records
- [ ] Get driver summary
- [ ] Get vehicle summary
- [ ] Update attendance record
- [ ] Delete attendance record

### Payroll Tests
- [ ] Create payroll period
- [ ] Reject overlapping periods
- [ ] Generate entries from attendance
- [ ] Verify employee calculations (salary + overtime + bonuses - deductions)
- [ ] Verify service provider calculations (rates + expenses + bonuses - penalties)
- [ ] Adjust entry (bonuses/deductions)
- [ ] Update period status (PENDING → PROCESSED → PAID)
- [ ] Delete pending period
- [ ] Prevent deleting paid period

### Calculation Tests
- [ ] Overtime: 180h triggers 20h overtime @ 1.5x
- [ ] Performance bonus: 65 trips triggers (65-50)×$5 = $75
- [ ] Punctuality bonus: 21/22 days = 95.45% triggers $100
- [ ] Efficiency bonus: 1900km/180h = 10.56 triggers $50
- [ ] TDS: 10% of gross pay
- [ ] Late penalty: Days with <8h @ $20/day
- [ ] Service quality bonus: 250 trips triggers $500
- [ ] GST TDS: 2% if GST number exists
- [ ] Performance penalty: <20 avg trips/vehicle triggers $500

---

## 📊 Expected Results

### Employee Payroll Example
**Input:**
- Base Salary: $5,000
- Hourly Rate: $30
- Days: 21
- Hours: 180
- Trips: 65
- Kms: 1,900

**Output:**
```
Base Pay:        $5,000.00
Overtime:        20h × $30 × 1.5 = $900.00
Performance:     (65-50) × $5 = $75.00
Punctuality:     95.45% = $100.00
Efficiency:      10.56 km/h = $50.00
─────────────────────────────
Gross Pay:       $6,125.00

TDS (10%):       -$612.50
─────────────────────────────
Net Pay:         $5,512.50
```

### Service Provider Example
**Input:**
- Monthly Rate: $10,000
- Per-Trip Rate: $5
- Trips: 250
- Kms: 3,500
- Fuel: $1,200
- Toll: $300
- GST: Yes

**Output:**
```
Monthly Rate:    $10,000.00
Per-Trip Bonus:  250 × $5 = $1,250.00
Quality Bonus:   250 > 200 = $500.00
Fuel:            $1,200.00
Toll:            $300.00
─────────────────────────────
Gross Pay:       $13,250.00

TDS (2%):        -$265.00
─────────────────────────────
Net Pay:         $12,985.00
```

---

## 🐛 Troubleshooting

### No Entries Generated
**Issue:** Generate endpoint returns 0 entries

**Solutions:**
1. Check attendance records exist: `GET /api/attendance?startDate=...&endDate=...`
2. Verify period status is PENDING
3. Ensure drivers have rates configured (baseSalary or hourlyRate)
4. Check service providers have rates (monthlyRate, perTripRate, etc.)

### Wrong Calculations
**Issue:** Numbers don't match expected

**Solutions:**
1. Verify attendance data accuracy
2. Check driver/provider rate configuration
3. Review attendance hours (<8h triggers penalties)
4. Confirm trip/km thresholds

### Can't Update Entry
**Issue:** PATCH returns 400/404

**Solutions:**
1. Verify period is still PENDING
2. Check entry belongs to this period
3. Confirm organization access

---

## 📝 Test Scenarios

### Scenario 1: Full Month - Employee
1. Create 22 attendance records (Mon-Fri for January)
2. Set hours: 180 total (triggers overtime)
3. Set trips: 65 (triggers performance bonus)
4. Set 2 days with <8h (triggers late penalty)
5. Generate payroll
6. Verify all bonuses and penalties applied

### Scenario 2: Outsourced Vehicle
1. Create 25 attendance records
2. Set 250 trips (triggers quality bonus)
3. Add fuel and toll expenses
4. Generate payroll
5. Verify expenses included
6. Verify GST TDS if applicable

### Scenario 3: Mixed Fleet
1. Create attendance for both in-house and outsourced
2. Generate single payroll period
3. Verify separate entries for each type
4. Verify totals match

---

## 🎯 Success Criteria

- ✅ All endpoints return 2xx for valid requests
- ✅ Calculations match documented formulas
- ✅ Bonuses auto-applied based on thresholds
- ✅ Deductions auto-calculated (TDS + penalties)
- ✅ Overtime calculated correctly
- ✅ Service provider rates applied properly
- ✅ Expenses included for outsourced
- ✅ Status workflow enforced
- ✅ No duplicate attendance allowed
- ✅ No overlapping periods allowed

---

**Happy Testing!** 🚀

For issues, check `/docs/api/` documentation or review the code in `/packages/server/src/routes/`.
