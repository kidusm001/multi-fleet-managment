# Manual Testing Guide for Filtered Payroll Generation

## Prerequisites
1. A running server instance
2. Valid authentication credentials
3. Test data in the database:
   - At least one organization with active session
   - Drivers with salary information
   - Vehicles (IN_HOUSE and/or OUTSOURCED)
   - Attendance records for the date range you want to test

## Testing with cURL

### 1. Basic Payroll Generation (Date Range Only)
```bash
curl -X POST http://localhost:3000/api/payroll-periods/generate-filtered \
  -H "Content-Type: application/json" \
  -H "Cookie: your-auth-cookie-here" \
  -d '{
    "startDate": "2025-11-01",
    "endDate": "2025-11-30"
  }'
```

### 2. Filter by Vehicle Type (IN_HOUSE only)
```bash
curl -X POST http://localhost:3000/api/payroll-periods/generate-filtered \
  -H "Content-Type: application/json" \
  -H "Cookie: your-auth-cookie-here" \
  -d '{
    "startDate": "2025-11-01",
    "endDate": "2025-11-30",
    "vehicleType": "IN_HOUSE"
  }'
```

### 3. Filter by Shifts
```bash
curl -X POST http://localhost:3000/api/payroll-periods/generate-filtered \
  -H "Content-Type: application/json" \
  -H "Cookie: your-auth-cookie-here" \
  -d '{
    "startDate": "2025-11-01",
    "endDate": "2025-11-30",
    "shiftIds": ["shift_id_1", "shift_id_2"]
  }'
```

### 4. Filter by Departments
```bash
curl -X POST http://localhost:3000/api/payroll-periods/generate-filtered \
  -H "Content-Type: application/json" \
  -H "Cookie: your-auth-cookie-here" \
  -d '{
    "startDate": "2025-11-01",
    "endDate": "2025-11-30",
    "departmentIds": ["dept_id_1", "dept_id_2"]
  }'
```

### 5. Filter by Locations/Branches
```bash
curl -X POST http://localhost:3000/api/payroll-periods/generate-filtered \
  -H "Content-Type: application/json" \
  -H "Cookie: your-auth-cookie-here" \
  -d '{
    "startDate": "2025-11-01",
    "endDate": "2025-11-30",
    "locationIds": ["location_id_1", "location_id_2"]
  }'
```

### 6. Combined Filters with Custom Name
```bash
curl -X POST http://localhost:3000/api/payroll-periods/generate-filtered \
  -H "Content-Type: application/json" \
  -H "Cookie: your-auth-cookie-here" \
  -d '{
    "startDate": "2025-11-01",
    "endDate": "2025-11-30",
    "vehicleType": "IN_HOUSE",
    "shiftIds": ["shift_morning_id"],
    "departmentIds": ["dept_engineering_id"],
    "locationIds": ["location_hq_id"],
    "name": "November 2025 - Engineering Morning Shift HQ"
  }'
```

## Testing with Postman

### Setup
1. Create a new POST request
2. URL: `http://localhost:3000/api/payroll-periods/generate-filtered`
3. Headers:
   - `Content-Type`: `application/json`
4. Auth: Use your session cookie or authentication method
5. Body (raw JSON):

```json
{
  "startDate": "2025-11-01",
  "endDate": "2025-11-30",
  "vehicleType": "IN_HOUSE",
  "shiftIds": ["shift_id_here"],
  "departmentIds": ["dept_id_here"],
  "locationIds": ["location_id_here"],
  "name": "Test Payroll"
}
```

### Expected Success Response (201)
```json
{
  "message": "Successfully generated payroll with 25 entries",
  "period": {
    "id": "clx...",
    "organizationId": "org_...",
    "name": "Test Payroll",
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
    "shiftIds": ["shift_id_here"],
    "departmentIds": ["dept_id_here"],
    "locationIds": ["location_id_here"],
    "vehicleIds": null
  }
}
```

## Getting IDs for Testing

### Get Shift IDs
```bash
curl -X GET http://localhost:3000/api/shifts \
  -H "Cookie: your-auth-cookie-here"
```

### Get Department IDs
```bash
curl -X GET http://localhost:3000/api/departments \
  -H "Cookie: your-auth-cookie-here"
```

### Get Location IDs
```bash
curl -X GET http://localhost:3000/api/locations \
  -H "Cookie: your-auth-cookie-here"
```

### Get Vehicle IDs
```bash
curl -X GET http://localhost:3000/api/vehicles \
  -H "Cookie: your-auth-cookie-here"
```

## Verification Steps

After generating payroll:

### 1. View the Created Payroll Period
```bash
curl -X GET http://localhost:3000/api/payroll-periods/{period_id} \
  -H "Cookie: your-auth-cookie-here"
```

### 2. List All Payroll Periods
```bash
curl -X GET http://localhost:3000/api/payroll-periods \
  -H "Cookie: your-auth-cookie-here"
```

### 3. Check Individual Entries
The response from step 1 will include all `payrollEntries` with details like:
- Driver/Service Provider information
- Amount, bonuses, deductions
- Days worked, hours, trips, kilometers
- Payment status

## Common Issues

### 1. "No attendance records found"
- Ensure you have attendance records for the specified date range
- Check if filters are too restrictive
- Verify vehicles are assigned to routes matching the filters

### 2. "Active organization not found"
- Make sure you're authenticated
- Verify you have an active organization in your session

### 3. "Payroll period already exists"
- Check for overlapping date ranges
- List existing periods to see what's already created
- Delete or use different dates

### 4. Invalid date format
- Use ISO 8601 format: `2025-11-01` or `2025-11-01T00:00:00Z`
- Ensure startDate is before endDate

## Database Queries for Verification

```sql
-- Check attendance records in date range
SELECT * FROM attendance_records 
WHERE organization_id = 'your_org_id' 
AND date BETWEEN '2025-11-01' AND '2025-11-30';

-- Check created payroll periods
SELECT * FROM payroll_periods 
WHERE organization_id = 'your_org_id' 
ORDER BY created_at DESC;

-- Check payroll entries with details
SELECT pe.*, d.name as driver_name, v.plate_number 
FROM payroll_entries pe
LEFT JOIN drivers d ON pe.driver_id = d.id
LEFT JOIN vehicles v ON pe.vehicle_id = v.id
WHERE pe.organization_id = 'your_org_id'
ORDER BY pe.created_at DESC;
```

## Integration with Frontend

Example React/TypeScript usage:

```typescript
const generateFilteredPayroll = async (filters: {
  startDate: string;
  endDate: string;
  vehicleType?: 'IN_HOUSE' | 'OUTSOURCED';
  shiftIds?: string[];
  departmentIds?: string[];
  locationIds?: string[];
  vehicleIds?: string[];
  name?: string;
}) => {
  const response = await fetch('/api/payroll-periods/generate-filtered', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include', // Include cookies
    body: JSON.stringify(filters),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message);
  }

  return response.json();
};

// Usage
try {
  const result = await generateFilteredPayroll({
    startDate: '2025-11-01',
    endDate: '2025-11-30',
    vehicleType: 'IN_HOUSE',
    shiftIds: [selectedShiftId],
    name: 'November 2025 Payroll',
  });
  
  console.log(`Created payroll period: ${result.period.id}`);
  console.log(`Generated ${result.entriesCount} entries`);
  console.log(`Total amount: $${result.totalAmount}`);
} catch (error) {
  console.error('Failed to generate payroll:', error.message);
}
```
