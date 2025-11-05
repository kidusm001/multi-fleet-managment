# Filtered Payroll Generation API

## Overview
This endpoint allows you to generate payroll with advanced filtering options similar to the notifications API. You can filter by date range, vehicle type, shifts, departments, and locations (branches).

## Endpoint
```
POST /api/payroll-periods/generate-filtered
```

## Authentication
Requires authentication via session.

## Request Body Schema

```typescript
{
  // Date range (required)
  startDate: string;  // ISO 8601 date or YYYY-MM-DD format
  endDate: string;    // ISO 8601 date or YYYY-MM-DD format
  
  // Optional filters
  vehicleType?: 'IN_HOUSE' | 'OUTSOURCED';
  shiftIds?: string[];        // Array of shift IDs
  departmentIds?: string[];   // Array of department IDs
  locationIds?: string[];     // Array of location/branch IDs
  vehicleIds?: string[];      // Array of specific vehicle IDs
  
  // Optional payroll period name (auto-generated if not provided)
  name?: string;
}
```

## Examples

### 1. Generate Payroll for Specific Date Range
```json
{
  "startDate": "2025-11-01",
  "endDate": "2025-11-30"
}
```

### 2. Generate Payroll for In-House Vehicles Only
```json
{
  "startDate": "2025-11-01",
  "endDate": "2025-11-30",
  "vehicleType": "IN_HOUSE"
}
```

### 3. Generate Payroll for Specific Shifts
```json
{
  "startDate": "2025-11-01",
  "endDate": "2025-11-30",
  "shiftIds": ["shift_morning_id", "shift_afternoon_id"]
}
```

### 4. Generate Payroll for Specific Departments
```json
{
  "startDate": "2025-11-01",
  "endDate": "2025-11-30",
  "departmentIds": ["dept_engineering_id", "dept_sales_id"]
}
```

### 5. Generate Payroll for Specific Branch/Location
```json
{
  "startDate": "2025-11-01",
  "endDate": "2025-11-30",
  "locationIds": ["location_hq_id", "location_branch_a_id"]
}
```

### 6. Generate Payroll with Combined Filters
```json
{
  "startDate": "2025-11-01",
  "endDate": "2025-11-30",
  "vehicleType": "IN_HOUSE",
  "shiftIds": ["shift_morning_id"],
  "departmentIds": ["dept_engineering_id"],
  "locationIds": ["location_hq_id"],
  "name": "November 2025 - Engineering Morning Shift"
}
```

## Response Success (201 Created)

```json
{
  "message": "Successfully generated payroll with 25 entries",
  "period": {
    "id": "period_id_123",
    "organizationId": "org_123",
    "name": "Payroll 2025-11-01 to 2025-11-30",
    "startDate": "2025-11-01T00:00:00.000Z",
    "endDate": "2025-11-30T23:59:59.999Z",
    "totalAmount": "125000.00",
    "status": "PENDING",
    "createdAt": "2025-11-05T10:00:00.000Z",
    "updatedAt": "2025-11-05T10:00:00.000Z"
  },
  "entriesCount": 25,
  "totalAmount": "125000.00",
  "filters": {
    "dateRange": {
      "startDate": "2025-11-01",
      "endDate": "2025-11-30"
    },
    "vehicleType": "IN_HOUSE",
    "shiftIds": ["shift_morning_id"],
    "departmentIds": ["dept_engineering_id"],
    "locationIds": ["location_hq_id"],
    "vehicleIds": null
  }
}
```

## Response Errors

### 400 Bad Request - Invalid Date Range
```json
{
  "message": "startDate must be before endDate"
}
```

### 400 Bad Request - Overlapping Period
```json
{
  "message": "A payroll period already exists for this date range",
  "existingPeriod": {
    "id": "existing_period_id",
    "name": "November 2025 Payroll",
    "startDate": "2025-11-01T00:00:00.000Z",
    "endDate": "2025-11-30T23:59:59.999Z"
  }
}
```

### 400 Bad Request - No Records Found
```json
{
  "message": "No attendance records found matching the specified filters",
  "filters": {
    "dateRange": {
      "startDate": "2025-11-01",
      "endDate": "2025-11-30"
    },
    "vehicleType": "IN_HOUSE",
    "shiftIds": ["shift_morning_id"],
    "departmentIds": null,
    "locationIds": null,
    "vehicleIds": null
  }
}
```

### 400 Bad Request - No Active Organization
```json
{
  "message": "Active organization not found"
}
```

### 500 Internal Server Error
```json
{
  "message": "Failed to generate payroll"
}
```

## How Filtering Works

### Date Range
- **Required**: Both `startDate` and `endDate` must be provided
- Filters attendance records between these dates (inclusive)
- Cannot overlap with existing payroll periods

### Vehicle Type
- Filters attendance records by vehicle type (`IN_HOUSE` or `OUTSOURCED`)
- `IN_HOUSE`: Generates salary-based entries for drivers
- `OUTSOURCED`: Generates service provider payment entries

### Shift Filter
- Filters vehicles assigned to routes with the specified shifts
- Multiple shifts can be specified (OR logic)

### Department Filter
- Filters vehicles based on routes serving employees in the specified departments
- Finds employees in those departments and includes vehicles on their routes

### Location/Branch Filter
- Filters vehicles assigned to routes at the specified locations
- Multiple locations can be specified (OR logic)

### Vehicle Filter
- Directly filters by specific vehicle IDs
- Useful when you want payroll for exact vehicles

### Combined Filters
- All filters work together with AND logic
- For example: `vehicleType=IN_HOUSE` AND `shiftIds=[shift1, shift2]` AND `departmentIds=[dept1]`

## Payroll Calculation Logic

### For Drivers (IN_HOUSE vehicles)
1. **Base Pay**: Either `baseSalary` (monthly) or `hourlyRate * hours worked`
2. **Overtime**: Hours beyond 160/month at `overtimeRate` (default 1.5x)
3. **Bonuses**:
   - Performance: $5 per trip over 50 trips
   - Punctuality: $100 if 95%+ attendance
   - Fuel efficiency: $50 if avg > 10 km/hour
4. **Deductions**:
   - Tax: 10% of gross pay
   - Late penalties: $20 per day with < 8 hours

### For Service Providers (OUTSOURCED vehicles)
1. **Base Pay**: 
   - `monthlyRate` (fixed monthly fee)
   - `perKmRate * kilometers covered`
   - `perTripRate * trips completed`
2. **Reimbursements**: Fuel and toll costs

## Notes
- All filters are optional except the date range
- If no filters are provided, generates payroll for all attendance records in the date range
- Payroll period is created with status `PENDING`
- Individual entries are also created with status `PENDING`
- After generation, you can review and modify entries before marking as `PROCESSED` or `PAID`
