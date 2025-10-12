# 🧪 Quick Test Commands

## Option 1: Run Unit Tests (Fastest)
```bash
./run-payroll-tests.sh
```
This runs all the automated tests without needing a running server.

---

## Option 2: Full End-to-End Test (Recommended)
```bash
# 1. Start the server
pnpm dev

# 2. In another terminal, run the test script
./test-payroll-system.sh
```

This will:
1. ✅ Authenticate with your credentials
2. ✅ Create test driver & vehicle
3. ✅ Create 10 attendance records
4. ✅ Get driver summary
5. ✅ Create payroll period
6. ✅ **Generate payroll automatically** (with calculations!)
7. ✅ Adjust entry (add bonus)
8. ✅ Update period status

---

## Option 3: Manual Testing with cURL

### Step 1: Authenticate
```bash
# Sign in and save session cookie
curl -c cookies.txt -X POST http://localhost:3000/api/auth/sign-in/email \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your-email@example.com",
    "password": "your-password"
  }'
```

### Step 2: Create Attendance
```bash
curl -b cookies.txt -X POST http://localhost:3000/api/attendance \
  -H "Content-Type: application/json" \
  -d '{
    "vehicleId": "your-vehicle-id",
    "driverId": "your-driver-id",
    "date": "2024-01-15",
    "hoursWorked": 180,
    "tripsCompleted": 65,
    "kmsCovered": 1900
  }'
```

### Step 3: Create Payroll Period
```bash
curl -b cookies.txt -X POST http://localhost:3000/api/payroll-periods \
  -H "Content-Type: application/json" \
  -d '{
    "name": "January 2024",
    "startDate": "2024-01-01",
    "endDate": "2024-01-31"
  }'
```

### Step 4: Generate Payroll (The Magic! ✨)
```bash
curl -b cookies.txt -X POST http://localhost:3000/api/payroll-periods/{period-id}/generate-entries
```

This will automatically calculate:
- ✅ Base salary or hourly pay
- ✅ Overtime (hours > 160 @ 1.5x)
- ✅ Performance bonus ($5 per trip over 50)
- ✅ Punctuality bonus ($100 if 95%+ attendance)
- ✅ Efficiency bonus ($50 if >10 km/h avg)
- ✅ TDS deduction (10%)
- ✅ Late penalties ($20 per day with <8h)

---

## What to Expect

### Employee Payroll Calculation Example
```
Input: 
  - Hours: 180 (triggers 20h overtime)
  - Trips: 65 (triggers performance bonus)
  - Days: 21 of 22 = 95.45% (triggers punctuality)
  - Kms: 1900 / 180h = 10.56 km/h (triggers efficiency)

Output:
  Base:         $5,000.00
  Overtime:       $900.00  (20h × $30 × 1.5)
  Performance:     $75.00  (15 trips × $5)
  Punctuality:    $100.00
  Efficiency:      $50.00
  ─────────────────────────
  Gross:        $6,125.00
  TDS:           -$612.50  (10%)
  ─────────────────────────
  Net Pay:      $5,512.50
```

---

## Troubleshooting

### "Server not running"
```bash
# Start the server first
pnpm dev
```

### "Session expired"
```bash
# Delete old cookies and re-authenticate
rm cookies.txt
# Then sign in again
```

### "No entries generated"
```bash
# Check if attendance records exist
curl -b cookies.txt "http://localhost:3000/api/attendance?startDate=2024-01-01&endDate=2024-01-31"
```

### "Driver/Vehicle not found"
```bash
# List your resources
curl -b cookies.txt "http://localhost:3000/api/drivers"
curl -b cookies.txt "http://localhost:3000/api/vehicles"
```

---

## Full Documentation
- 📖 Complete Testing Guide: `TESTING_GUIDE.md`
- 📚 API Documentation: `/docs/api/`
- 🔍 Coverage Analysis: `/docs/api/PAYROLL_COVERAGE_ANALYSIS.md`
- ⚡ Quick Reference: `PAYROLL_QUICK_REFERENCE.md`
