# Vehicle Availability API

## Overview
The Vehicle Availability API tracks and manages the availability of vehicles, drivers, and routes for specific dates and times. This is a superadmin-only feature designed for global fleet oversight and coordination.

## Base Route
```
/api/vehicle-availability
```

## Authentication & Permissions
- All endpoints require authentication
- All endpoints require `superadmin` role

---

## Superadmin Endpoints

### GET /superadmin
**Get all vehicle availability records**

**Authentication:** Required  
**Permissions:** `superadmin` role  
**Access:** Global - returns records from all organizations

**Request:**
```http
GET /api/vehicle-availability/superadmin?organizationId=org_123&startDate=2024-09-01&endDate=2024-09-30
```

**Query Parameters:**
- `organizationId` (string, optional) - Filter by organization
- `vehicleId` (string, optional) - Filter by vehicle
- `driverId` (string, optional) - Filter by driver
- `routeId` (string, optional) - Filter by route
- `shiftId` (string, optional) - Filter by shift
- `startDate` (string, optional) - Date range start (YYYY-MM-DD)
- `endDate` (string, optional) - Date range end (YYYY-MM-DD)

**Response:**
```json
[
  {
    "id": "avail_123",
    "date": "2024-09-04T00:00:00.000Z",
    "startTime": "2024-09-04T08:00:00.000Z",
    "endTime": "2024-09-04T17:00:00.000Z",
    "available": true,
    "vehicleId": "vehicle_456",
    "driverId": "driver_789",
    "routeId": "route_101",
    "shiftId": "shift_202",
    "organizationId": "org_303",
    "organization": {
      "id": "org_303",
      "name": "Global Transport"
    },
    "vehicle": {
      "id": "vehicle_456",
      "name": "Bus #5",
      "plateNumber": "BUS-005"
    },
    "driver": {
      "id": "driver_789",
      "name": "Jane Smith"
    },
    "route": {
      "id": "route_101",
      "name": "City Loop"
    },
    "shift": {
      "id": "shift_202",
      "name": "Morning Shift"
    }
  }
]
```

**Features:**
- Comprehensive filtering options
- Complete relationship data for context
- Ordered by date (newest first)

---

### GET /superadmin/:id
**Get specific vehicle availability record by ID**

**Authentication:** Required  
**Permissions:** `superadmin` role  
**Access:** Global - can access any record

**Request:**
```http
GET /api/vehicle-availability/superadmin/avail_123
```

**Response:** Complete availability record object with all relationships

---

### POST /superadmin
**Create a new vehicle availability record**

**Authentication:** Required  
**Permissions:** `superadmin` role  
**Access:** Global - can create records for any organization

**Request:**
```http
POST /api/vehicle-availability/superadmin
Content-Type: application/json
```

**Request Body:**
```json
{
  "date": "2024-09-05",
  "startTime": "2024-09-05T09:00:00.000Z",
  "endTime": "2024-09-05T18:00:00.000Z",
  "available": false,
  "vehicleId": "vehicle_456",
  "driverId": "driver_789",
  "routeId": null,
  "shiftId": "shift_202",
  "organizationId": "org_303"
}
```

**Required Fields:**
- `date` (string) - Date of availability
- `startTime` (string) - Start time of availability
- `endTime` (string) - End time of availability
- `vehicleId` (string) - Associated vehicle
- `driverId` (string) - Associated driver
- `organizationId` (string) - Associated organization

**Validation:**
- All required fields must be present
- Organization, vehicle, driver, and shift (if provided) must exist and belong to the same organization
- Prevents duplicate records for the same vehicle, shift, and date

**Response (201):** Newly created availability record

**Error Responses:**
- `400` - Missing fields or invalid entity relationships
- `404` - Related entity not found
- `409` - Duplicate record conflict
- `500` - Internal server error

---

### PUT /superadmin/:id
**Update a vehicle availability record**

**Authentication:** Required  
**Permissions:** `superadmin` role  
**Access:** Global - can update any record

**Request:**
```http
PUT /api/vehicle-availability/superadmin/avail_123
Content-Type: application/json
```

**Request Body:** (All fields optional)
```json
{
  "available": false,
  "endTime": "2024-09-04T16:30:00.000Z"
}
```

**Response:** Updated availability record object

---

### DELETE /superadmin/:id
**Delete a vehicle availability record**

**Authentication:** Required  
**Permissions:** `superadmin` role  
**Access:** Global - can delete any record

**Request:**
```http
DELETE /api/vehicle-availability/superadmin/avail_123
```

**Response:** `200 OK` with success message

---

### GET /superadmin/stats/summary
**Get summary statistics for vehicle availability**

**Authentication:** Required  
**Permissions:** `superadmin` role  
**Access:** Global analytics across all organizations

**Request:**
```http
GET /api/vehicle-availability/superadmin/stats/summary
```

**Response:**
```json
{
  "totalRecords": 150,
  "availableRecords": 120,
  "unavailableRecords": 30,
  "availabilityByOrganization": [
    {
      "organization": "Global Transport",
      "count": 75
    },
    {
      "organization": "City Transit",
      "count": 50
    }
  ]
}
```

**Features:**
- Global availability statistics
- Breakdown of available vs. unavailable records
- Organization-wise record count

---

## Vehicle Availability Model

```typescript
interface VehicleAvailability {
  id: string;
  date: Date;
  startTime: Date;
  endTime: Date;
  available: boolean;
  
  // Relations
  vehicleId: string;
  driverId: string;
  routeId?: string | null;
  shiftId?: string | null;
  organizationId: string;
  
  organization: Organization;
  vehicle: Vehicle;
  driver: Driver;
  route?: Route | null;
  shift?: Shift | null;
}
```

### Availability Properties
- `date` - The specific date of the availability record
- `startTime` / `endTime` - The time window of availability
- `available` - Boolean status (true for available, false for unavailable)

### Relationship Management
- **Vehicle/Driver**: Core entities for availability tracking
- **Route/Shift**: Context for scheduled availability
- **Organization**: Owning organization for data scoping

---

## Key Features

### **1. Global Fleet Oversight**
- Centralized availability management for all organizations
- Comprehensive filtering for targeted analysis
- Global statistics for high-level planning

### **2. Scheduling & Coordination**
- Tracks vehicle and driver availability for specific time windows
- Prevents scheduling conflicts with duplicate record checks
- Associates availability with routes and shifts for operational context

### **3. Data Integrity**
- Validates existence and relationships of all associated entities (organization, vehicle, driver, shift)
- Ensures that related entities belong to the same organization
- Provides clear error messages for validation failures

### **4. Analytics & Reporting**
- Summary statistics provide insights into fleet-wide availability
- Organization-level breakdown helps identify resource distribution
- Tracks available vs. unavailable assets for capacity planning

This API is a powerful tool for superadmins to monitor and manage fleet availability across the entire system, ensuring efficient resource allocation and operational coordination.
