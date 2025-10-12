# Enhanced Payroll Calculation Logic

## Overview
The trigger-based payroll system now includes **automated bonuses, deductions, and overtime calculations** based on attendance data and performance metrics.

---

## 🚀 Employee (In-House Drivers) Calculation

### 1. Base Pay Calculation

**Salary-Based (Monthly)**
```typescript
if (driver.baseSalary) {
  basePay = driver.baseSalary; // Full monthly salary
}
```

**Hourly-Based (Regular Hours)**
```typescript
else if (driver.hourlyRate) {
  const regularHours = Math.min(hoursWorked, 160);
  basePay = driver.hourlyRate × regularHours;
}
```

### 2. Overtime Calculation ⭐ NEW

```typescript
const regularHoursPerMonth = 160; // 8 hours/day × 20 days

if (hoursWorked > 160 && driver.hourlyRate) {
  const overtimeHours = hoursWorked - 160;
  const overtimeRate = driver.overtimeRate || 1.5; // Default 1.5x
  overtimePay = driver.hourlyRate × overtimeHours × overtimeRate;
}
```

**Example:**
- Regular hours: 160h @ $25/hr = $4,000
- Overtime: 20h @ $25/hr × 1.5 = $750
- **Total: $4,750**

### 3. Automated Bonuses ⭐ NEW

**Performance Bonus** (Trips)
```typescript
if (tripsCompleted > 50) {
  bonus += (tripsCompleted - 50) × $5;
}
```
- Example: 65 trips = (65 - 50) × $5 = **$75 bonus**

**Punctuality Bonus** (Attendance)
```typescript
const attendanceRate = (daysWorked / 22) × 100;
if (attendanceRate >= 95%) {
  bonus += $100;
}
```
- Example: 21 days worked = 95.45% = **$100 bonus**

**Fuel Efficiency Bonus** (Performance)
```typescript
const avgKmPerHour = kmsCovered / hoursWorked;
if (avgKmPerHour > 10) {
  bonus += $50;
}
```
- Example: 1800km / 176h = 10.23 km/h = **$50 bonus**

### 4. Automated Deductions ⭐ NEW

**Tax Deduction (TDS)**
```typescript
const grossPay = basePay + overtimePay + bonuses;
deduction += grossPay × 0.10; // 10% TDS
```

**Late Penalties**
```typescript
const lateDays = records.filter(r => r.hoursWorked < 8).length;
deduction += lateDays × $20;
```
- Example: 3 late days = 3 × $20 = **$60 penalty**

### 5. Net Pay
```typescript
netPay = (basePay + overtimePay + bonuses) - deductions
```

### Complete Example

**Driver: John Doe**
- Base Salary: $5,000/month
- Hourly Rate: $30/hour
- Overtime Rate: 1.5x
- Days Worked: 21 days
- Hours Worked: 178 hours
- Trips: 62 trips
- Kms: 1,850 km
- Late Days: 2 days

**Calculation:**
```
Base Pay:        $5,000.00
Overtime:        18h × $30 × 1.5 = $810.00
Performance:     (62-50) × $5 = $60.00
Punctuality:     21/22 = 95.45% = $100.00
Efficiency:      1850/178 = 10.39 km/h = $50.00
─────────────────────────────
Gross Pay:       $6,020.00

TDS (10%):       -$602.00
Late Penalty:    2 × $20 = -$40.00
─────────────────────────────
Net Pay:         $5,378.00
```

---

## 🚚 Service Provider (Outsourced) Calculation

### 1. Base Payment Calculation

**Priority 1: Monthly Rate**
```typescript
if (serviceProvider.monthlyRate) {
  amount = serviceProvider.monthlyRate; // Full monthly payment
}
```

**Priority 2: Per-Kilometer Rate**
```typescript
if (serviceProvider.perKmRate) {
  if (amount == 0) {
    amount = serviceProvider.perKmRate × kmsCovered;
  } else {
    bonuses += serviceProvider.perKmRate × kmsCovered;
  }
}
```

**Priority 3: Per-Trip Rate**
```typescript
if (serviceProvider.perTripRate) {
  if (amount == 0) {
    amount = serviceProvider.perTripRate × tripsCompleted;
  } else {
    bonuses += serviceProvider.perTripRate × tripsCompleted;
  }
}
```

**Fallback: Daily Rate**
```typescript
if (amount == 0 && vehicle.dailyRate) {
  amount = vehicle.dailyRate × daysWorked;
}
```

### 2. Expenses

```typescript
amount += fuelCost + tollCost;
```

### 3. Automated Bonuses ⭐ NEW

**Service Quality Bonus**
```typescript
if (tripsCompleted > 200) {
  bonuses += $500;
}
```
- Example: 245 trips = **$500 bonus**

### 4. Automated Deductions ⭐ NEW

**TDS for GST Registered** (2%)
```typescript
if (serviceProvider.gstNumber) {
  deduction += grossPay × 0.02;
}
```

**Performance Penalty**
```typescript
const avgTripsPerVehicle = totalTrips / numberOfVehicles;
if (avgTripsPerVehicle < 20) {
  deduction += $500;
}
```
- Example: 45 trips / 3 vehicles = 15 avg = **$500 penalty**

### 5. Net Payment
```typescript
netPay = (amount + bonuses) - deductions
```

### Complete Example

**Provider: ABC Transport**
- Monthly Rate: $10,000
- Per-Trip Rate: $5 (bonus on top)
- GST Number: Yes
- Vehicles: 3
- Days Worked: 25 days
- Trips: 240 trips
- Kms: 3,500 km
- Fuel Cost: $1,200
- Toll Cost: $300

**Calculation:**
```
Monthly Rate:    $10,000.00
Per-Trip Bonus:  240 × $5 = $1,200.00
Service Bonus:   240 > 200 = $500.00
Fuel Expenses:   $1,200.00
Toll Expenses:   $300.00
─────────────────────────────
Gross Pay:       $13,200.00

TDS (2%):        -$264.00
Performance:     240/3 = 80 avg (OK) = $0.00
─────────────────────────────
Net Pay:         $12,936.00
```

---

## 📊 Summary Comparison

### Before Enhancement

| Feature | Coverage |
|---------|----------|
| Base pay | ✅ Yes |
| Overtime | ❌ No |
| Bonuses | ❌ Manual only |
| Deductions | ❌ Manual only |
| Tax calculation | ❌ No |
| Performance tracking | ❌ No |

### After Enhancement

| Feature | Coverage |
|---------|----------|
| Base pay | ✅ Yes |
| **Overtime** | ✅ **Automatic** |
| **Bonuses** | ✅ **3 types auto** |
| **Deductions** | ✅ **TDS + Penalties** |
| **Tax calculation** | ✅ **10% TDS** |
| **Performance tracking** | ✅ **Yes** |

---

## 🎯 Automated Bonus Types

### Employee Bonuses
1. **Performance**: $5/trip over 50 trips
2. **Punctuality**: $100 for 95%+ attendance
3. **Efficiency**: $50 for 10+ km/hour average

### Service Provider Bonuses
1. **Quality**: $500 for 200+ trips
2. **Rate-based**: Additional per-km or per-trip earnings

---

## ⚠️ Automated Deduction Types

### Employee Deductions
1. **TDS**: 10% of gross pay
2. **Late Penalty**: $20 per late day (< 8 hours)

### Service Provider Deductions
1. **TDS**: 2% if GST registered
2. **Performance Penalty**: $500 if avg < 20 trips/vehicle

---

## 🔧 Configuration

### Driver Setup
```typescript
{
  baseSalary: 5000,        // Monthly salary
  hourlyRate: 30,          // Or hourly rate
  overtimeRate: 1.5,       // Overtime multiplier
}
```

### Service Provider Setup
```typescript
{
  monthlyRate: 10000,      // Fixed monthly
  perKmRate: 2.5,          // Per kilometer
  perTripRate: 5,          // Per trip
  gstNumber: "29AAA...",   // For TDS
}
```

---

## 📈 Performance Metrics

### Tracked Automatically
- Days worked
- Hours worked
- Trips completed
- Kilometers covered
- Attendance rate
- Average km/hour
- Late days
- Average trips/vehicle

### Used For
- Overtime calculation
- Bonus eligibility
- Penalty assessment
- Performance evaluation

---

## 🚀 Usage

The enhanced calculation is **automatic** when you trigger payroll generation:

```bash
POST /api/payroll-periods/:id/generate-entries
```

All bonuses, deductions, and overtime are calculated based on:
- Attendance records
- Driver/provider configuration
- Performance thresholds
- Tax rules

**No manual intervention needed!** ✨

---

## 📝 Adjustments

You can still manually adjust after generation:

```bash
PATCH /api/payroll-periods/:periodId/entries/:entryId
{
  "bonuses": 1000,      // Add special bonus
  "deductions": 200     // Add special deduction
}
```

Net pay recalculates automatically.

---

## 🎓 Best Practices

1. **Set up rates properly** before first payroll
2. **Record attendance daily** for accuracy
3. **Review generated entries** for anomalies
4. **Adjust thresholds** based on your business rules
5. **Monitor performance** metrics regularly

---

This enhanced system provides **fully automated, fair, and transparent** payroll calculations! 🎉
