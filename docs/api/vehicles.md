# Vehicles API

## Overview
The Vehicles API provides comprehensive management of fleet vehicles including creation, updates, driver assignments, availability tracking, and maintenance scheduling.

## Base Route
```
/api/vehicles
```

## Authentication & Permissions
- All endpoints require authentication
- Superadmin routes require `superadmin` role
- Organization-scoped routes require appropriate vehicle permissions
- Permission validation through Better Auth integration

---

## Superadmin Endpoints

### GET /superadmin
**Get all vehicles (superadmin only)**

Returns all vehicles across all organizations with full details.

**Access:** Superadmin only

**Query Parameters:**
- `includeDeleted` (optional) - Include soft-deleted vehicles

**Response:**
```json
[
  {
    "id": "clm123abc456",
    "plateNumber": "ABC-123",
    "name": "Company Van #1",
    "model": "Transit",
    "make": "Ford",
    "type": "IN_HOUSE",
    "vendor": "Ford Dealership",
    "capacity": 12,
    "year": 2023,
    "status": "AVAILABLE",
    "dailyRate": 150.00,
    "lastMaintenance": "2024-01-15T00:00:00.000Z",
    "nextMaintenance": "2024-04-15T00:00:00.000Z",
    "deleted": false,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z",
    "categoryId": "clm123category",
    "driverId": "clm123driver",
    "organizationId": "clm123org",
    "category": {
      "id": "clm123category",
      "name": "Large Van",
      "capacity": 12
    },
    "driver": {
      "id": "clm123driver",
      "name": "John Doe",
      "licenseNumber": "DL123456"
    },
    "organization": {
      "id": "clm123org",
      "name": "Acme Corp"
    },
    "routes": [],
    "payrollReports": []
  }
]
```

---

### GET /superadmin/with-deleted
**Get all vehicles including deleted ones**

Returns all vehicles including soft-deleted records.

**Access:** Superadmin only

**Response:** Same as GET /superadmin but includes deleted vehicles

---

### GET /superadmin/:id
**Get specific vehicle by ID**

**Access:** Superadmin only

**Parameters:**
- `id` (string, required) - Vehicle ID (CUID)

**Response:**
```json
{
  "id": "clm123abc456",
  "plateNumber": "ABC-123",
  "name": "Company Van #1",
  // ... full vehicle details with relations
  "vehicleAvailability": [
    {
      "id": "clm123avail",
      "vehicleId": "clm123abc456",
      "shiftId": "clm123shift",
      "date": "2024-01-15",
      "isAvailable": true
    }
  ]
}
```

**Error Responses:**
- `400` - Invalid vehicle ID
- `404` - Vehicle not found

---

### GET /superadmin/by-organization/:organizationId
**Get all vehicles for a specific organization**

**Access:** Superadmin only

**Parameters:**
- `organizationId` (string, required) - Organization ID

**Query Parameters:**
- `includeDeleted` (optional) - Include soft-deleted vehicles

**Response:** Array of vehicles for the specified organization

---

### POST /superadmin
**Create a new vehicle (Superadmin)**

**Authentication:** Required  
**Permissions:** `superadmin` role  
**Access:** Global - can create vehicles for any organization

**Request:**
```http
POST /api/vehicles/superadmin
Content-Type: application/json
```

**Request Body:**
```json
{
  "plateNumber": "ABC-123",
  "name": "Company Van #1",
  "model": "Transit",
  "make": "Ford",
  "type": "IN_HOUSE",
  "vendor": "Ford Dealership",
  "capacity": 12,
  "year": 2023,
  "status": "AVAILABLE",
  "lastMaintenance": "2024-01-15T00:00:00.000Z",
  "nextMaintenance": "2024-04-15T00:00:00.000Z",
  "dailyRate": 150.00,
  "categoryId": "clm123category",
  "driverId": "clm123driver",
  "organizationId": "clm123org"
}
```

**Required Fields:**
- `plateNumber` (string) - Unique vehicle plate number
- `model` (string) - Vehicle model
- `capacity` (number > 0) - Passenger capacity
- `organizationId` (string) - Target organization ID

**Optional Fields:**
- `name` (string) - Display name for vehicle
- `make` (string) - Vehicle manufacturer
- `type` (VehicleType) - "IN_HOUSE" | "OUTSOURCED" (default: "IN_HOUSE")
- `vendor` (string) - Supplier/vendor information
- `year` (number) - Manufacturing year (1900 to current year + 1)
- `status` (VehicleStatus) - Initial status (default: "AVAILABLE")
- `lastMaintenance` (ISO date) - Last maintenance date
- `nextMaintenance` (ISO date) - Next scheduled maintenance
- `dailyRate` (number) - Daily rental/usage rate
- `categoryId` (string) - Vehicle category ID
- `driverId` (string) - Assigned driver ID

**Validation Logic:**
- Plate number must be globally unique
- Organization must exist
- Category must exist (if provided)
- Driver must exist (if provided)
- Year validation: 1900 ≤ year ≤ current year + 1
- Type validation: "IN_HOUSE" or "OUTSOURCED"
- Status validation: Valid VehicleStatus enum value

**Response (201):**
```json
{
  "id": "vehicle_new123",
  "plateNumber": "ABC-123",
  "name": "Company Van #1",
  "model": "Transit",
  "make": "Ford",
  "type": "IN_HOUSE",
  "vendor": "Ford Dealership",
  "capacity": 12,
  "year": 2023,
  "status": "AVAILABLE",
  "lastMaintenance": "2024-01-15T00:00:00.000Z",
  "nextMaintenance": "2024-04-15T00:00:00.000Z",
  "dailyRate": 150.00,
  "categoryId": "clm123category",
  "driverId": "clm123driver",
  "organizationId": "clm123org",
  "deleted": false,
  "createdAt": "2024-09-04T12:30:00.000Z",
  "updatedAt": "2024-09-04T12:30:00.000Z",
  "category": {
    "id": "clm123category",
    "name": "Passenger Van",
    "description": "Standard passenger transportation"
  },
  "driver": {
    "id": "clm123driver",
    "name": "John Doe",
    "isActive": true
  },
  "organization": {
    "id": "clm123org",
    "name": "Transport Company Inc"
  }
}
```

**Error Responses:**
- `400` - Validation errors (missing required fields, invalid values)
- `404` - Referenced entity not found (organization, category, driver)
- `409` - Plate number already exists (unique constraint violation)
- `500` - Internal server error

---

### PUT /superadmin/:id
**Update a vehicle**

**Access:** Superadmin only

**Parameters:**
- `id` (string, required) - Vehicle ID

**Request Body:** Same as POST but all fields optional

**Response:** Updated vehicle object

**Error Responses:**
- `400` - Invalid vehicle ID or validation errors
- `404` - Vehicle not found
- `409` - Plate number conflict

---

### PATCH /superadmin/:id/assign-driver
**Assign or unassign driver to vehicle (Superadmin)**

**Authentication:** Required  
**Permissions:** `superadmin` role  
**Access:** Global - can assign drivers across all organizations

**Request:**
```http
PATCH /api/vehicles/superadmin/vehicle_123/assign-driver
Content-Type: application/json
```

**Path Parameters:**
- `id` (string, required) - Vehicle ID

**Request Body:**
```json
{
  "driverId": "driver_456"
}
```
**To unassign driver:**
```json
{
  "driverId": null
}
```

**Required Fields:**
- `driverId` (string | null) - Driver ID to assign, or null to unassign

**Global Validation:**
- Vehicle must exist (any organization)
- Driver must exist (any organization, if provided)
- Driver must be active (`isActive: true`)
- No organization scope restrictions

**Response:**
```json
{
  "message": "Driver assigned successfully",
  "vehicle": {
    "id": "vehicle_123",
    "plateNumber": "ABC-123",
    "driverId": "driver_456",
    "category": {...},
    "driver": {
      "id": "driver_456",
      "name": "John Doe",
      "isActive": true
    },
    "organization": {
      "id": "org_456",
      "name": "Transport Company"
    }
  }
}
```

**Error Responses:**
- `400` - Invalid vehicle ID or driver not active
- `404` - Vehicle or driver not found
- `500` - Internal server error

---

### PATCH /superadmin/:id/status
**Update vehicle status (Superadmin)**

**Authentication:** Required  
**Permissions:** `superadmin` role  
**Access:** Global - can update any vehicle status

**Request:**
```http
PATCH /api/vehicles/superadmin/vehicle_123/status
Content-Type: application/json
```

**Path Parameters:**
- `id` (string, required) - Vehicle ID

**Request Body:**
```json
{
  "status": "MAINTENANCE"
}
```

**Required Fields:**
- `status` (VehicleStatus) - New status value

**Business Logic:**
- Setting status to `MAINTENANCE`, `OUT_OF_SERVICE`, or `INACTIVE` automatically unassigns driver
- No organization scope restrictions
- Global vehicle status management

**Response:**
```json
{
  "message": "Vehicle status updated successfully",
  "vehicle": {
    "id": "vehicle_123",
    "status": "MAINTENANCE",
    "driverId": null,
    "organization": {...}
  }
}
```

---

### GET /superadmin/maintenance
**Get maintenance schedule for all vehicles (Superadmin)**

**Authentication:** Required  
**Permissions:** `superadmin` role  
**Access:** Global - returns maintenance data across all organizations

**Request:**
```http
GET /api/vehicles/superadmin/maintenance
```

**Response:**
```json
[
  {
    "id": "vehicle_123",
    "plateNumber": "ABC-123",
    "status": "MAINTENANCE",
    "lastMaintenance": "2024-08-15T00:00:00.000Z",
    "nextMaintenance": "2024-11-15T00:00:00.000Z",
    "organization": {
      "id": "org_456",
      "name": "Transport Company"
    },
    "category": {...}
  }
]
```

**Features:**
- Cross-organization maintenance overview
- Maintenance scheduling insights
- Fleet-wide maintenance coordination

---

### GET /superadmin/available
**Get all available vehicles across organizations (Superadmin)**

**Authentication:** Required  
**Permissions:** `superadmin` role  
**Access:** Global - returns available vehicles from all organizations

**Request:**
```http
GET /api/vehicles/superadmin/available
```

**Query Logic:**
- Status must be `AVAILABLE`
- Vehicle must be active
- Not deleted
- Global availability overview

**Response:** Array of available vehicles across all organizations with organization details

---

### DELETE /superadmin/:id
**Soft delete vehicle (Superadmin)**

**Authentication:** Required  
**Permissions:** `superadmin` role  
**Access:** Global - can delete vehicles from any organization

**Request:**
```http
DELETE /api/vehicles/superadmin/vehicle_123
```

**Path Parameters:**
- `id` (string, required) - Vehicle ID

**Business Logic:**
- Performs soft delete (sets `deleted: true`, `deletedAt: timestamp`)
- Sets vehicle status to `OUT_OF_SERVICE` and `isActive: false`
- Prevents deletion if vehicle has active routes
- Checks for active route assignments before deletion
- Global deletion capability across organizations

**Active Route Validation:**
- Counts active routes assigned to vehicle
- Prevents deletion if active routes exist
- Provides specific error message with route count

**Response:** `204 No Content`

**Error Responses:**
- `400` - Invalid vehicle ID, already deleted, or vehicle has active routes
- `404` - Vehicle not found
- `500` - Internal server error

**Example Error (Active Routes):**
```json
{
  "message": "Cannot delete vehicle. It is currently assigned to 3 active route(s). Please reassign or cancel the routes first."
}
```
**Soft delete a vehicle**

**Access:** Superadmin only

**Parameters:**
- `id` (string, required) - Vehicle ID

**Response:**
```json
{
  "message": "Vehicle deleted successfully"
}
```

**Error Responses:**
- `400` - Invalid vehicle ID
- `404` - Vehicle not found

---

### PATCH /superadmin/:id/restore
**Restore a soft-deleted vehicle**

**Access:** Superadmin only

**Parameters:**
- `id` (string, required) - Vehicle ID

**Response:**
```json
{
  "message": "Vehicle restored successfully",
  "vehicle": {
    // restored vehicle object
  }
}
```

---

### PATCH /superadmin/:id/assign-driver
**Assign or unassign a driver to a vehicle**

**Access:** Superadmin only

**Parameters:**
- `id` (string, required) - Vehicle ID

**Request Body:**
```json
{
  "driverId": "clm123driver" // or null to unassign
}
```

**Response:**
```json
{
  "message": "Driver assigned successfully",
  "vehicle": {
    // updated vehicle object
  }
}
```

---

### PATCH /superadmin/:id/status
**Update vehicle status**

**Access:** Superadmin only

**Parameters:**
- `id` (string, required) - Vehicle ID

**Request Body:**
```json
{
  "status": "MAINTENANCE"
}
```

**Valid Statuses:**
- `AVAILABLE`
- `IN_USE`
- `MAINTENANCE`
- `OUT_OF_SERVICE`
- `INACTIVE`

**Response:**
```json
{
  "message": "Vehicle status updated successfully",
  "vehicle": {
    // updated vehicle object
  }
}
```

---

### GET /superadmin/stats/summary
**Get vehicle statistics summary**

**Access:** Superadmin only

**Response:**
```json
{
  "totalVehicles": 50,
  "activeVehicles": 45,
  "inMaintenanceVehicles": 3,
  "availableVehicles": 25,
  "inUseVehicles": 17,
  "byOrganization": [
    {
      "organizationId": "clm123org",
      "organizationName": "Acme Corp",
      "vehicleCount": 15,
      "availableCount": 8
    }
  ],
  "byCategory": [
    {
      "categoryId": "clm123cat",
      "categoryName": "Large Van",
      "vehicleCount": 20
    }
  ],
  "byStatus": {
    "AVAILABLE": 25,
    "IN_USE": 17,
    "MAINTENANCE": 3,
    "OUT_OF_SERVICE": 0,
    "INACTIVE": 5
  }
}
```

---

## Organization-Scoped Endpoints

### GET /
**Get vehicles for user's organization**

**Authentication:** Required  
**Permissions:** `vehicle.read`  
**Organization Context:** Uses `activeOrganizationId` from session

**Request:**
```http
GET /api/vehicles
```

**Query Parameters:** None

**Response:**
```json
[
  {
    "id": "vehicle_123",
    "plateNumber": "ABC-123",
    "name": "Fleet Vehicle 1",
    "model": "Transit",
    "make": "Ford",
    "type": "VAN",
    "vendor": "Ford Dealership",
    "capacity": 12,
    "year": 2023,
    "status": "AVAILABLE",
    "lastMaintenance": "2024-08-01T00:00:00.000Z",
    "nextMaintenance": "2024-11-01T00:00:00.000Z",
    "dailyRate": 150.00,
    "organizationId": "org_456",
    "deleted": false,
    "createdAt": "2024-08-15T10:30:00.000Z",
    "updatedAt": "2024-08-15T10:30:00.000Z",
    "category": {
      "id": "cat_789",
      "name": "Passenger Van",
      "description": "Standard passenger transportation"
    },
    "driver": null
  }
]
```

**Features:**
- Returns only vehicles from user's active organization
- Excludes deleted vehicles
- Includes category and driver relationships
- Ordered by creation date (newest first)

**Error Responses:**
- `400` - Active organization not found in session
- `403` - Insufficient permissions
- `500` - Internal server error

---

### GET /:id
**Get specific vehicle by ID within user's organization**

**Authentication:** Required  
**Permissions:** `vehicle.read`  
**Organization Context:** Vehicle must belong to user's active organization

**Request:**
```http
GET /api/vehicles/vehicle_123
```

**Path Parameters:**
- `id` (string, required) - Vehicle ID

**Response:**
```json
{
  "id": "vehicle_123",
  "plateNumber": "ABC-123",
  "name": "Fleet Vehicle 1",
  "model": "Transit",
  "make": "Ford",
  "type": "VAN",
  "vendor": "Ford Dealership",
  "capacity": 12,
  "year": 2023,
  "status": "AVAILABLE",
  "lastMaintenance": "2024-08-01T00:00:00.000Z",
  "nextMaintenance": "2024-11-01T00:00:00.000Z",
  "dailyRate": 150.00,
  "categoryId": "cat_789",
  "driverId": null,
  "organizationId": "org_456",
  "deleted": false,
  "createdAt": "2024-08-15T10:30:00.000Z",
  "updatedAt": "2024-08-15T10:30:00.000Z",
  "category": {
    "id": "cat_789",
    "name": "Passenger Van",
    "description": "Standard passenger transportation"
  },
  "driver": null,
  "routes": [],
  "payrollReports": [],
  "vehicleAvailability": []
}
```

**Features:**
- Returns vehicle with complete relationship data
- Includes routes, payroll reports, and availability records
- Organization-scoped access control
- Validates vehicle belongs to user's organization

**Error Responses:**
- `400` - Invalid vehicle ID or active organization not found
- `403` - Insufficient permissions
- `404` - Vehicle not found in organization
- `500` - Internal server error

---

### POST /
**Create a new vehicle in user's organization**

**Authentication:** Required  
**Permissions:** `vehicle.create`  
**Organization Context:** Vehicle automatically assigned to user's active organization

**Request:**
```http
POST /api/vehicles
Content-Type: application/json
```

**Request Body:**
```json
{
  "plateNumber": "XYZ-789",
  "name": "Company Van #2",
  "model": "Sprinter",
  "make": "Mercedes",
  "type": "VAN",
  "vendor": "Mercedes Dealership",
  "capacity": 16,
  "year": 2024,
  "status": "AVAILABLE",
  "lastMaintenance": "2024-08-01T00:00:00.000Z",
  "nextMaintenance": "2024-11-01T00:00:00.000Z",
  "dailyRate": 180.00,
  "categoryId": "cat_789",
  "driverId": "driver_456"
}
```

**Required Fields:**
- `plateNumber` (string) - Unique within organization
- `model` (string) - Vehicle model
- `capacity` (number > 0) - Passenger capacity

**Optional Fields:**
- `name` (string) - Display name for vehicle
- `make` (string) - Vehicle manufacturer
- `type` (VehicleType) - "VAN", "BUS", "CAR", etc.
- `vendor` (string) - Supplier/vendor information
- `year` (number) - Manufacturing year
- `status` (VehicleStatus) - Initial status (defaults to AVAILABLE)
- `lastMaintenance` (ISO date) - Last maintenance date
- `nextMaintenance` (ISO date) - Next scheduled maintenance
- `dailyRate` (number) - Daily rental/usage rate
- `categoryId` (string) - Vehicle category ID (must exist in organization)
- `driverId` (string) - Assigned driver ID (must exist in organization)

**Validation:**
- Plate number must be unique within organization
- Category and driver must belong to same organization if provided
- Organization ID automatically set from session

**Response (201):**
```json
{
  "id": "vehicle_new123",
  "plateNumber": "XYZ-789",
  "name": "Company Van #2",
  "model": "Sprinter",
  "make": "Mercedes",
  "type": "VAN",
  "vendor": "Mercedes Dealership",
  "capacity": 16,
  "year": 2024,
  "status": "AVAILABLE",
  "dailyRate": 180.00,
  "organizationId": "org_456",
  "deleted": false,
  "createdAt": "2024-09-04T10:30:00.000Z",
  "updatedAt": "2024-09-04T10:30:00.000Z",
  "category": {
    "id": "cat_789",
    "name": "Large Van",
    "description": "High capacity passenger van"
  },
  "driver": {
    "id": "driver_456",
    "name": "John Doe"
  }
}
```

**Error Responses:**
- `400` - Active organization not found or validation errors
- `403` - Insufficient permissions
- `404` - Referenced category or driver not found in organization
- `409` - Plate number already exists in organization
- `500` - Internal server error

---

### PUT /:id
**Update vehicle in user's organization**

**Authentication:** Required  
**Permissions:** `vehicle.update`  
**Organization Context:** Vehicle must belong to user's active organization

**Request:**
```http
PUT /api/vehicles/vehicle_123
Content-Type: application/json
```

**Path Parameters:**
- `id` (string, required) - Vehicle ID

**Request Body:** (All fields optional)
```json
{
  "plateNumber": "ABC-123-UPDATED",
  "name": "Updated Fleet Vehicle",
  "model": "Transit Connect",
  "status": "MAINTENANCE",
  "dailyRate": 165.00,
  "nextMaintenance": "2024-12-01T00:00:00.000Z"
}
```

**Features:**
- Validates plate number uniqueness within organization
- Checks vehicle ownership before update
- Prevents conflicts with existing plate numbers

**Response:**
```json
{
  "id": "vehicle_123",
  "plateNumber": "ABC-123-UPDATED",
  "name": "Updated Fleet Vehicle",
  "model": "Transit Connect",
  "status": "MAINTENANCE",
  "dailyRate": 165.00,
  "organizationId": "org_456",
  "updatedAt": "2024-09-04T11:15:00.000Z",
  "category": {...},
  "driver": {...}
}
```

**Error Responses:**
- `400` - Active organization not found or validation errors
- `403` - Insufficient permissions
- `404` - Vehicle not found in organization
- `409` - Plate number conflict within organization
- `500` - Internal server error

---

### DELETE /:id
**Soft delete vehicle in user's organization**

**Authentication:** Required  
**Permissions:** `vehicle.delete`  
**Organization Context:** Vehicle must belong to user's active organization

**Request:**
```http
DELETE /api/vehicles/vehicle_123
```

**Path Parameters:**
- `id` (string, required) - Vehicle ID

**Business Logic:**
- Performs soft delete (sets `deleted: true`, `deletedAt: timestamp`)
- Sets vehicle status to `OUT_OF_SERVICE` and `isActive: false`
- Prevents deletion if vehicle has active routes
- Checks for active route assignments before deletion

**Response:** `204 No Content`

**Error Responses:**
- `400` - Active organization not found, already deleted, or vehicle has active routes
- `403` - Insufficient permissions
- `404` - Vehicle not found in organization
- `500` - Internal server error

---

### PATCH /:id/restore
**Restore soft-deleted vehicle in user's organization**

**Authentication:** Required  
**Permissions:** `vehicle.update` or `vehicle.create`  
**Organization Context:** Vehicle must belong to user's active organization

**Request:**
```http
PATCH /api/vehicles/vehicle_123/restore
```

**Features:**
- Restores soft-deleted vehicles
- Sets `deleted: false`, `deletedAt: null`, `isActive: true`
- Returns vehicle to usable state

**Response:** Restored vehicle object

**Error Responses:**
- `400` - Active organization not found or vehicle not deleted
- `403` - Insufficient permissions
- `404` - Vehicle not found in organization

---

### GET /maintenance
**Get vehicles currently in maintenance for user's organization**

**Authentication:** Required  
**Permissions:** `vehicle.read`  
**Organization Context:** Returns only organization's vehicles

**Request:**
```http
GET /api/vehicles/maintenance
```

**Response:**
```json
[
  {
    "id": "vehicle_123",
    "plateNumber": "ABC-123",
    "status": "MAINTENANCE",
    "lastMaintenance": "2024-08-15T00:00:00.000Z",
    "nextMaintenance": "2024-11-15T00:00:00.000Z",
    "maintenanceStartDate": "2024-08-15T00:00:00.000Z",
    "expectedEndDate": "2024-11-15T00:00:00.000Z",
    "maintenanceDuration": 92,
    "category": {...},
    "routes": []
  }
]
```

**Features:**
- Filters vehicles with `MAINTENANCE` status
- Calculates maintenance duration in days
- Includes maintenance timeline information
- Ordered by last maintenance date (newest first)

---

### GET /available
**Get available vehicles in user's organization**

**Authentication:** Required  
**Permissions:** `vehicle.read`  
**Organization Context:** Returns only organization's available vehicles

**Request:**
```http
GET /api/vehicles/available
```

**Query Logic:**
- Status must be `AVAILABLE`
- Vehicle must be active (`isActive: true`)
- Not deleted (`deleted: false`)
- No active route assignments

**Response:**
```json
[
  {
    "id": "vehicle_456",
    "plateNumber": "XYZ-789",
    "status": "AVAILABLE",
    "isActive": true,
    "capacity": 16,
    "category": {
      "id": "cat_789",
      "name": "Large Van"
    },
    "driver": null
  }
]
```

**Features:**
- Excludes vehicles assigned to active routes
- Ordered by plate number alphabetically
- Includes category and driver information

---

### PATCH /:id/assign-driver
**Assign or unassign driver to vehicle in user's organization**

**Authentication:** Required  
**Permissions:** `vehicle.update`  
**Organization Context:** Vehicle and driver must belong to user's active organization

**Request:**
```http
PATCH /api/vehicles/vehicle_123/assign-driver
Content-Type: application/json
```

**Path Parameters:**
- `id` (string, required) - Vehicle ID

**Request Body:**
```json
{
  "driverId": "driver_456"
}
```
**To unassign driver:**
```json
{
  "driverId": null
}
```

**Required Fields:**
- `driverId` (string | null) - Driver ID to assign, or null to unassign

**Validation:**
- Vehicle must exist in user's organization
- Driver must exist in same organization (if provided)
- Driver must be active (`isActive: true`)

**Response:**
```json
{
  "message": "Driver assigned successfully",
  "vehicle": {
    "id": "vehicle_123",
    "plateNumber": "ABC-123",
    "name": "Fleet Vehicle 1",
    "driverId": "driver_456",
    "category": {...},
    "driver": {
      "id": "driver_456",
      "name": "John Doe",
      "isActive": true
    }
  }
}
```

**Error Responses:**
- `400` - Active organization not found or driver not active
- `403` - Insufficient permissions
- `404` - Vehicle or driver not found in organization
- `500` - Internal server error

---

### PATCH /:id/status
**Update vehicle status in user's organization**

**Authentication:** Required  
**Permissions:** `vehicle.update`  
**Organization Context:** Vehicle must belong to user's active organization

**Request:**
```http
PATCH /api/vehicles/vehicle_123/status
Content-Type: application/json
```

**Path Parameters:**
- `id` (string, required) - Vehicle ID

**Request Body:**
```json
{
  "status": "MAINTENANCE"
}
```

**Required Fields:**
- `status` (VehicleStatus) - New status value

**Vehicle Status Values:**
- `AVAILABLE` - Ready for assignment
- `IN_USE` - Currently assigned to route
- `MAINTENANCE` - Under maintenance
- `OUT_OF_SERVICE` - Temporarily unavailable
- `INACTIVE` - Permanently inactive

**Business Logic:**
- Setting status to `MAINTENANCE`, `OUT_OF_SERVICE`, or `INACTIVE` automatically unassigns driver (`driverId: null`)
- Status changes are logged and tracked

**Response:**
```json
{
  "message": "Vehicle status updated successfully",
  "vehicle": {
    "id": "vehicle_123",
    "status": "MAINTENANCE",
    "driverId": null,
    "category": {...},
    "driver": null
  }
}
```

**Error Responses:**
- `400` - Active organization not found
- `403` - Insufficient permissions
- `404` - Vehicle not found in organization
- `500` - Internal server error

---

### PATCH /:id/maintenance-status
**Update vehicle maintenance status with automatic scheduling**

**Authentication:** Required  
**Permissions:** `vehicle.update`  
**Organization Context:** Vehicle must belong to user's active organization

**Request:**
```http
PATCH /api/vehicles/vehicle_123/maintenance-status
Content-Type: application/json
```

**Path Parameters:**
- `id` (string, required) - Vehicle ID

**Request Body:**
```json
{
  "status": "MAINTENANCE"
}
```

**Automatic Maintenance Logic:**
- When status = `MAINTENANCE`:
  - Sets `lastMaintenance` to current date
  - Sets `nextMaintenance` to 30 days from now
  - Automatically unassigns driver (`driverId: null`)
- When status = `AVAILABLE`:
  - Clears `nextMaintenance` field
  - Marks vehicle as ready for assignment

**Response:**
```json
{
  "message": "Vehicle status changed from AVAILABLE to MAINTENANCE. Maintenance scheduled until 10/4/2024",
  "vehicle": {
    "id": "vehicle_123",
    "status": "MAINTENANCE",
    "lastMaintenance": "2024-09-04T12:00:00.000Z",
    "nextMaintenance": "2024-10-04T12:00:00.000Z",
    "driverId": null,
    "category": {...},
    "driver": null,
    "routes": []
  }
}
```

**Features:**
- Automatic maintenance scheduling
- Driver unassignment for safety
- Maintenance timeline calculation
- Status transition messaging

**Error Responses:**
- `400` - Active organization not found
- `403` - Insufficient permissions
- `404` - Vehicle not found in organization
- `500` - Internal server error

---

### GET /shuttle-availability/shift/:shiftId/available
**Get vehicles available for specific shift (shuttle-specific)**

**Authentication:** Required  
**Permissions:** `vehicle.read`  
**Organization Context:** Shift and vehicles must belong to user's active organization

**Request:**
```http
GET /api/vehicles/shuttle-availability/shift/shift_123/available
```

**Path Parameters:**
- `shiftId` (string, required) - Shift ID

**Features:**
- Checks shift-specific vehicle availability
- Considers shift timing and conflicts
- Returns vehicles not assigned during shift timeframe
- Shuttle service optimization

**Response:** Array of available vehicles for the shuttle shift

**Error Responses:**
- `400` - Active organization not found
- `403` - Insufficient permissions
- `404` - Shift not found in organization
- `500` - Internal server error

---

### POST /:id/check-availability
**Check vehicle availability for specific time window**

**Authentication:** Required  
**Permissions:** `vehicle.read`  
**Organization Context:** Vehicle must belong to user's active organization

**Request:**
```http
POST /api/vehicles/vehicle_123/check-availability
Content-Type: application/json
```

**Path Parameters:**
- `id` (string, required) - Vehicle ID

**Request Body:**
```json
{
  "shiftId": "shift_456",
  "proposedDate": "2024-09-05",
  "proposedStartTime": "2024-09-05T08:00:00.000Z",
  "proposedEndTime": "2024-09-05T17:00:00.000Z"
}
```

**Required Fields:**
- `shiftId` (string) - Shift ID for availability check
- `proposedDate` (string) - Date for availability check
- `proposedStartTime` (ISO string) - Proposed start time
- `proposedEndTime` (ISO string) - Proposed end time

**Features:**
- Uses VehicleAvailabilityService for complex availability logic
- Validates route time window conflicts
- Checks for overlapping assignments
- Returns detailed availability analysis

**Response:**
```json
{
  "vehicleId": "vehicle_123",
  "available": true,
  "reason": "Vehicle is available for the requested time window",
  "timeWindow": {
    "start": "2024-09-05T08:00:00.000Z",
    "end": "2024-09-05T17:00:00.000Z",
    "date": "2024-09-05"
  }
}
```

**Availability Check Logic:**
- Validates against existing route assignments
- Checks maintenance schedules
- Considers vehicle status and availability
- Evaluates time window conflicts

**Error Responses:**
- `400` - Missing required fields or active organization not found
- `403` - Insufficient permissions
- `404` - Vehicle not found in organization
- `500` - Internal server error

**Response:**
```json
{
  "message": "Vehicle deleted successfully"
}
```

---

### PATCH /:id/restore
**Restore soft-deleted vehicle**

**Access:** Requires `vehicle:update` permission

**Parameters:**
- `id` (string, required) - Vehicle ID

**Response:**
```json
{
  "message": "Vehicle restored successfully"
}
```

---

### PATCH /:id/assign-driver
**Assign driver to vehicle**

**Access:** Requires `vehicle:update` permission

**Parameters:**
- `id` (string, required) - Vehicle ID

**Request Body:**
```json
{
  "driverId": "clm123driver"
}
```

**Response:** Updated vehicle object

---

### PATCH /:id/status
**Update vehicle status**

**Access:** Requires `vehicle:update` permission

**Parameters:**
- `id` (string, required) - Vehicle ID

**Request Body:**
```json
{
  "status": "MAINTENANCE"
}
```

**Response:** Updated vehicle object

---

### GET /available-for-shift/:shiftId
**Get vehicles available for a specific shift**

**Access:** Authenticated users

**Parameters:**
- `shiftId` (string, required) - Shift ID

**Query Parameters:**
- `date` (string) - Date for availability check (ISO format)

**Response:**
```json
[
  {
    "id": "clm123abc456",
    "plateNumber": "ABC-123",
    "name": "Company Van #1",
    "capacity": 12,
    "status": "AVAILABLE",
    "category": {
      "name": "Large Van"
    },
    "driver": {
      "name": "John Doe"
    }
  }
]
```

---

### GET /stats/summary
**Get vehicle statistics for user's organization**

**Access:** Authenticated users

**Response:**
```json
{
  "totalVehicles": 15,
  "activeVehicles": 13,
  "availableVehicles": 8,
  "inUseVehicles": 5,
  "byCategory": [
    {
      "categoryName": "Large Van",
      "count": 8
    }
  ],
  "byStatus": {
    "AVAILABLE": 8,
    "IN_USE": 5,
    "MAINTENANCE": 2
  }
}
```

---

## Vehicle Model

### Vehicle Object
```typescript
interface Vehicle {
  id: string;
  plateNumber: string;
  name?: string;
  model: string;
  make?: string;
  type: 'IN_HOUSE' | 'OUTSOURCED';
  vendor?: string;
  capacity: number;
  year?: number;
  status: 'AVAILABLE' | 'IN_USE' | 'MAINTENANCE' | 'OUT_OF_SERVICE' | 'INACTIVE';
  dailyRate?: number;
  lastMaintenance?: Date;
  nextMaintenance?: Date;
  deleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  categoryId?: string;
  driverId?: string;
  organizationId: string;
  
  // Relations
  category?: VehicleCategory;
  driver?: Driver;
  organization: Organization;
  routes: Route[];
  vehicleAvailability: VehicleAvailability[];
  payrollReports: PayrollReport[];
}
```

### Vehicle Status Values
- `AVAILABLE` - Vehicle is available for assignment
- `IN_USE` - Vehicle is currently assigned to a route
- `MAINTENANCE` - Vehicle is undergoing maintenance
- `OUT_OF_SERVICE` - Vehicle is temporarily out of service
- `INACTIVE` - Vehicle is not currently in active use

### Vehicle Type Values
- `IN_HOUSE` - Vehicle owned by the organization
- `OUTSOURCED` - Vehicle provided by external vendor

---

## Error Handling

### Common Error Responses

**Validation Error (400):**
```json
{
  "message": "Validation failed",
  "errors": [
    {
      "field": "plateNumber",
      "message": "Plate number is required"
    }
  ]
}
```

**Unauthorized (401):**
```json
{
  "message": "Authentication required"
}
```

**Forbidden (403):**
```json
{
  "message": "Insufficient permissions"
}
```

**Not Found (404):**
```json
{
  "message": "Vehicle not found"
}
```

**Conflict (409):**
```json
{
  "message": "Vehicle with this plate number already exists"
}
```

**Server Error (500):**
```json
{
  "message": "Internal Server Error"
}
```

---

## Usage Examples

### Creating a Vehicle
```bash
curl -X POST /api/vehicles \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "plateNumber": "XYZ-789",
    "name": "Delivery Van #2",
    "model": "Sprinter",
    "make": "Mercedes",
    "capacity": 8,
    "categoryId": "clm123category"
  }'
```

### Updating Vehicle Status
```bash
curl -X PATCH /api/vehicles/clm123abc456/status \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "MAINTENANCE"
  }'
```

### Getting Available Vehicles for Shift
```bash
curl -X GET "/api/vehicles/available-for-shift/clm123shift?date=2024-01-15" \
  -H "Authorization: Bearer YOUR_TOKEN"
```
