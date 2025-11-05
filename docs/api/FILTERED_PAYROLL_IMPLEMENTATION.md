# Filtered Payroll Generation - Implementation Summary

## Overview
Created a new API endpoint for generating payroll with advanced filtering capabilities, similar to the notifications API date range pattern.

## Files Created/Modified

### 1. Schema Definition
**File**: `packages/server/src/schema/payrollSchema.ts`
- Created Zod schema `GeneratePayrollSchema` for request validation
- Supports date ranges (startDate, endDate)
- Supports optional filters: vehicleType, shiftIds, departmentIds, locationIds, vehicleIds
- Optional custom payroll period name

### 2. API Endpoint
**File**: `packages/server/src/routes/payroll-periods.ts`
- Added `POST /api/payroll-periods/generate-filtered` endpoint
- Validates input using Zod middleware
- Filters attendance records based on provided criteria
- Generates payroll entries for drivers (IN_HOUSE) and service providers (OUTSOURCED)
- Returns created period with summary

### 3. Documentation
**File**: `docs/api/payroll-generation-filtered.md`
- Complete API documentation with examples
- Request/response schemas
- Error handling documentation
- Filtering logic explanation
- Payroll calculation formulas

**File**: `docs/api/payroll-generation-filtered-testing.md`
- Manual testing guide with cURL examples
- Postman setup instructions
- Database verification queries
- Frontend integration examples
- Troubleshooting common issues

### 4. Tests
**File**: `packages/server/src/routes/__tests__/payroll-filtered-generation.test.ts`
- Placeholder tests for validation
- Comments explaining test data requirements
- Reference to documentation for manual testing

## API Usage

### Endpoint
```
POST /api/payroll-periods/generate-filtered
```

### Request Body
```json
{
  "startDate": "2025-11-01",
  "endDate": "2025-11-30",
  "vehicleType": "IN_HOUSE",
  "shiftIds": ["shift_id_1", "shift_id_2"],
  "departmentIds": ["dept_id_1"],
  "locationIds": ["location_id_1"],
  "vehicleIds": ["vehicle_id_1"],
  "name": "Custom Payroll Name"
}
```

### Response (201 Created)
```json
{
  "message": "Successfully generated payroll with 25 entries",
  "period": {
    "id": "period_id",
    "organizationId": "org_id",
    "name": "Custom Payroll Name",
    "startDate": "2025-11-01T00:00:00.000Z",
    "endDate": "2025-11-30T23:59:59.999Z",
    "totalAmount": "125000.00",
    "status": "PENDING"
  },
  "entriesCount": 25,
  "totalAmount": "125000.00",
  "filters": { ... }
}
```

## Filter Behavior

### Date Range (Required)
- Filters attendance records between `startDate` and `endDate` (inclusive)
- Checks for overlapping payroll periods
- Auto-generates period name if not provided

### Vehicle Type (Optional)
- `IN_HOUSE`: Only in-house vehicles (salary-based driver payroll)
- `OUTSOURCED`: Only outsourced vehicles (service provider payments)

### Shift Filter (Optional)
- Filters by routes assigned to specified shifts
- Multiple shifts work with OR logic

### Department Filter (Optional)
- Filters by vehicles serving employees in specified departments
- Looks up employees → stops → routes → vehicles

### Location Filter (Optional)
- Filters by routes at specified locations/branches
- Multiple locations work with OR logic

### Vehicle Filter (Optional)
- Direct filter by specific vehicle IDs
- Most precise filtering option

### Combined Filters
- All filters work together with AND logic
- More filters = more restrictive results

## Payroll Calculation

### Drivers (IN_HOUSE)
1. **Base Pay**: `baseSalary` or `hourlyRate × hours`
2. **Overtime**: Hours > 160 at `overtimeRate` (default 1.5×)
3. **Bonuses**:
   - Performance: $5 per trip over 50
   - Punctuality: $100 if 95%+ attendance
   - Fuel efficiency: $50 if avg > 10 km/hour
4. **Deductions**:
   - Tax: 10% of gross
   - Late penalties: $20 per day < 8 hours

### Service Providers (OUTSOURCED)
1. **Base Pay**: `monthlyRate` + `perKmRate × km` + `perTripRate × trips`
2. **Reimbursements**: Fuel + toll costs
3. **No Deductions**

## Key Features

✅ Date range validation and overlap checking
✅ Flexible filtering (all filters optional except dates)
✅ Automatic payroll calculation with bonuses/deductions
✅ Transaction-based creation (atomic)
✅ Organization-scoped (multi-tenant safe)
✅ Detailed response with filter summary
✅ Error messages include applied filters for debugging

## Next Steps

### For Production Use
1. Add proper integration tests with test database
2. Consider adding background job processing for large payrolls
3. Add webhook/notification on completion
4. Consider adding dry-run mode to preview before creating

### For Frontend Integration
1. Create filter UI components
2. Add date range picker
3. Add multi-select for shifts/departments/locations
4. Show preview of affected records before generation
5. Display success/error messages with filter details

### For Enhanced Features
1. Add support for partial month payroll (prorated salaries)
2. Add custom bonus/deduction rules
3. Add payroll templates for common filter combinations
4. Add scheduled/recurring payroll generation
5. Add approval workflow before finalizing

## Testing

### Manual Testing
See `docs/api/payroll-generation-filtered-testing.md` for:
- cURL examples
- Postman setup
- Database verification queries
- Frontend integration code

### Prerequisites for Testing
1. Active organization with session
2. Drivers with salary information
3. Vehicles assigned to routes
4. Attendance records in the date range
5. Shifts, departments, and locations set up

## Error Handling

| Status | Message | Cause |
|--------|---------|-------|
| 400 | startDate must be before endDate | Invalid date range |
| 400 | Payroll period already exists | Overlapping period |
| 400 | No attendance records found | No data matching filters |
| 400 | Active organization not found | Not authenticated |
| 500 | Failed to generate payroll | Server error |

## Notes
- All filters are applied at the database level for efficiency
- Transaction ensures atomic creation (all or nothing)
- Payroll period created with status `PENDING` for review
- Individual entries also created with status `PENDING`
- Can be modified before marking as `PROCESSED` or `PAID`
