# Attendance Records API

## Overview
The Attendance Records API manages daily work records for drivers and vehicles, tracking hours worked, trips completed, kilometers covered, and expenses. These records serve as the foundation for automatic payroll generation.

## Base Route
`/api/attendance`

## Authentication & Permissions
All endpoints require authentication via Better Auth. Organization-scoped endpoints automatically filter data by the user's active organization.

---

## Organization-Scoped Endpoints

### GET /
**Get all attendance records for user's organization**

**Query Parameters:**
- `startDate` (optional): Filter records from this date (ISO 8601)
- `endDate` (optional): Filter records until this date (ISO 8601)
- `driverId` (optional): Filter by specific driver
- `vehicleId` (optional): Filter by specific vehicle
- `page` (optional, default: 1): Page number
- `limit` (optional, default: 50): Records per page

**Response:**
```json
{
  "records": [
    {
      "id": "clxxx",
      "driverId": "clxxx",
      "vehicleId": "clxxx",
      "date": "2024-01-15T00:00:00.000Z",
      "hoursWorked": 8.5,
      "tripsCompleted": 12,
      "kmsCovered": 145.5,
      "fuelCost": 350.00,
      "tollCost": 50.00,
      "driver": {
        "id": "clxxx",
        "name": "John Doe",
        "email": "john@example.com",
        "licenseNumber": "DL123456"
      },
      "vehicle": {
        "id": "clxxx",
        "model": "Toyota Hiace",
        "plateNumber": "AA-12345",
        "type": "IN_HOUSE"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 150,
    "totalPages": 3
  }
}
```

---

### GET /:id
**Get specific attendance record**

**Response:**
```json
{
  "id": "clxxx",
  "driverId": "clxxx",
  "vehicleId": "clxxx",
  "date": "2024-01-15T00:00:00.000Z",
  "hoursWorked": 8.5,
  "tripsCompleted": 12,
  "kmsCovered": 145.5,
  "fuelCost": 350.00,
  "tollCost": 50.00,
  "driver": {
    "id": "clxxx",
    "name": "John Doe",
    "email": "john@example.com",
    "licenseNumber": "DL123456",
    "baseSalary": 5000.00,
    "hourlyRate": 25.00
  },
  "vehicle": {
    "id": "clxxx",
    "model": "Toyota Hiace",
    "plateNumber": "AA-12345",
    "type": "IN_HOUSE",
    "dailyRate": 300.00
  }
}
```

---

### POST /
**Create attendance record**

**Request Body:**
```json
{
  "driverId": "clxxx",  // Optional for outsourced vehicles
  "vehicleId": "clxxx",  // Required
  "date": "2024-01-15",  // Required
  "hoursWorked": 8.5,
  "tripsCompleted": 12,
  "kmsCovered": 145.5,
  "fuelCost": 350.00,
  "tollCost": 50.00
}
```

**Response:** Returns the created attendance record (201)

**Validations:**
- `vehicleId` and `date` are required
- Vehicle must belong to the organization
- Driver (if provided) must belong to the organization
- No duplicate records for same vehicle and date

---

### PUT /:id
**Update attendance record**

**Request Body:**
```json
{
  "driverId": "clxxx",
  "hoursWorked": 9.0,
  "tripsCompleted": 15,
  "kmsCovered": 160.0,
  "fuelCost": 380.00,
  "tollCost": 60.00
}
```

**Response:** Returns the updated attendance record

---

### DELETE /:id
**Delete attendance record**

**Response:**
```json
{
  "message": "Attendance record deleted successfully"
}
```

---

### GET /summary/driver/:driverId
**Get attendance summary for a driver**

**Query Parameters:**
- `startDate` (optional): Summary from this date
- `endDate` (optional): Summary until this date

**Response:**
```json
{
  "driverId": "clxxx",
  "period": {
    "startDate": "2024-01-01",
    "endDate": "2024-01-31"
  },
  "summary": {
    "totalDays": 22,
    "totalHours": 176.0,
    "totalTrips": 264,
    "totalKms": 3190.5,
    "totalFuelCost": 7700.00,
    "totalTollCost": 1100.00
  },
  "records": [...]
}
```

---

### GET /summary/vehicle/:vehicleId
**Get attendance summary for a vehicle**

**Query Parameters:**
- `startDate` (optional): Summary from this date
- `endDate` (optional): Summary until this date

**Response:**
```json
{
  "vehicleId": "clxxx",
  "period": {
    "startDate": "2024-01-01",
    "endDate": "2024-01-31"
  },
  "summary": {
    "totalDays": 22,
    "totalHours": 176.0,
    "totalTrips": 264,
    "totalKms": 3190.5,
    "totalFuelCost": 7700.00,
    "totalTollCost": 1100.00
  },
  "records": [...]
}
```

---

### POST /bulk
**Bulk create attendance records**

**Request Body:**
```json
{
  "records": [
    {
      "driverId": "clxxx",
      "vehicleId": "clxxx",
      "date": "2024-01-15",
      "hoursWorked": 8.5,
      "tripsCompleted": 12,
      "kmsCovered": 145.5,
      "fuelCost": 350.00,
      "tollCost": 50.00
    },
    // ... more records
  ]
}
```

**Response:**
```json
{
  "message": "25 attendance records created successfully",
  "records": [...]
}
```

**Validations:**
- All vehicles must belong to the organization
- All drivers must belong to the organization
- Each record must have `vehicleId` and `date`

---

## Superadmin Endpoints

### GET /superadmin/all
**Get all attendance records (superadmin only)**

**Query Parameters:**
- `organizationId` (optional): Filter by organization
- `startDate` (optional): Filter from this date
- `endDate` (optional): Filter until this date
- `page` (optional, default: 1)
- `limit` (optional, default: 50)

**Response:**
```json
{
  "records": [
    {
      "id": "clxxx",
      "organization": {
        "id": "clxxx",
        "name": "Acme Transport"
      },
      "driver": {...},
      "vehicle": {...},
      ...
    }
  ],
  "pagination": {...}
}
```

---

### GET /superadmin/stats
**Get attendance statistics (superadmin only)**

**Query Parameters:**
- `organizationId` (optional): Filter by organization
- `startDate` (optional): Filter from this date
- `endDate` (optional): Filter until this date

**Response:**
```json
{
  "totalRecords": 1250,
  "totalHours": 10000.5,
  "totalTrips": 15000,
  "totalKms": 180500.0,
  "totalFuelCost": 385000.00,
  "totalTollCost": 55000.00,
  "recordsWithDriver": 950,
  "recordsWithoutDriver": 300
}
```

---

## Attendance Record Model

```typescript
interface AttendanceRecord {
  id: string;
  driverId?: string;  // Null for outsourced vehicles
  vehicleId: string;
  date: Date;
  hoursWorked?: number;
  tripsCompleted: number;
  kmsCovered?: number;
  fuelCost?: Decimal;
  tollCost?: Decimal;
  organizationId: string;
  createdAt: Date;
  updatedAt: Date;
  
  // Relations
  driver?: Driver;
  vehicle: Vehicle;
  organization: Organization;
}
```

---

## Usage Flow

1. **Daily Recording**: At the end of each day, create an attendance record for each vehicle/driver
2. **Summary Review**: Use summary endpoints to review performance over a period
3. **Payroll Generation**: Attendance records automatically feed into payroll period entry generation
4. **Bulk Import**: Use bulk endpoint for importing historical data or batch uploads

---

## Error Codes

- **400**: Bad request (missing required fields, invalid data)
- **404**: Record/resource not found
- **409**: Duplicate record (same vehicle and date)
- **500**: Server error
