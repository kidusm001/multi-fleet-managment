# Routes API

## Overview
The Routes API manages transportation routes including vehicle assignments, shift scheduling, stop sequences, and route optimization. Routes connect vehicles, shifts, and stops to create transportation paths for employees.

## Base Route
```
/api/routes
```

## Authentication & Permissions
- All endpoints require authentication
- Superadmin routes require `superadmin` role
- Organization-scoped routes require appropriate route permissions
- Permission validation through Better Auth integration

---

## Superadmin Endpoints

### GET /superadmin
**Get all routes across all organizations**

Returns all routes with complete details including vehicles, shifts, and stops.

**Access:** Superadmin only

**Response:**
```json
[
  {
    "id": "clm123route456",
    "name": "Downtown Express",
    "description": "Morning commute route through downtown area",
    "vehicleId": "clm123vehicle",
    "shiftId": "clm123shift",
    "date": "2024-01-15T00:00:00.000Z",
    "startTime": "07:30:00.000Z",
    "endTime": "09:00:00.000Z",
    "totalDistance": 15.5,
    "totalTime": 90,
    "status": "ACTIVE",
    "isActive": true,
    "deleted": false,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z",
    "organizationId": "clm123org",
    "organization": {
      "id": "clm123org",
      "name": "Acme Corp"
    },
    "vehicle": {
      "id": "clm123vehicle",
      "plateNumber": "ABC-123",
      "name": "Van #1",
      "capacity": 12,
      "status": "IN_USE"
    },
    "shift": {
      "id": "clm123shift",
      "name": "Morning Shift",
      "startTime": "08:00:00",
      "endTime": "17:00:00"
    },
    "stops": [
      {
        "id": "clm123stop1",
        "name": "Central Plaza",
        "address": "123 Main St",
        "latitude": 40.7128,
        "longitude": -74.0060,
        "sequence": 1,
        "estimatedArrivalTime": "07:45:00.000Z",
        "employee": {
          "id": "clm123emp1",
          "name": "John Doe"
        }
      }
    ]
  }
]
```

---

### GET /superadmin/:id
**Get specific route by ID**

**Access:** Superadmin only

**Parameters:**
- `id` (string, required) - Route ID (CUID)

**Response:** Single route object with full details

**Error Responses:**
- `400` - Invalid route ID
- `404` - Route not found

---

### GET /superadmin/by-organization/:organizationId
**Get all routes for a specific organization**

**Access:** Superadmin only

**Parameters:**
- `organizationId` (string, required) - Organization ID

**Response:** Array of routes for the specified organization

---

### POST /superadmin
**Create a new route**

**Access:** Superadmin only

**Request Body:**
```json
{
  "name": "Evening Route",
  "description": "Evening shuttle service",
  "vehicleId": "clm123vehicle",
  "shiftId": "clm123shift",
  "date": "2024-01-15T00:00:00.000Z",
  "startTime": "17:30:00.000Z",
  "endTime": "19:00:00.000Z",
  "totalDistance": 12.0,
  "totalTime": 75,
  "status": "ACTIVE",
  "isActive": true,
  "organizationId": "clm123org"
}
```

**Required Fields:**
- `name` (string, 1-255 characters)
- `organizationId` (string, valid CUID)

**Optional Fields:**
- `description` (string, max 1000 characters)
- `vehicleId` (string, valid CUID)
- `shiftId` (string, valid CUID)
- `date` (ISO datetime)
- `startTime` (ISO datetime)
- `endTime` (ISO datetime)
- `totalDistance` (number ≥ 0)
- `totalTime` (number, 0-180 minutes)
- `status` (enum: RouteStatus)
- `isActive` (boolean, default: true)

**Validation:**
- Organization must exist
- Vehicle and shift must exist and belong to same organization
- Total time cannot exceed 180 minutes
- End time must be after start time

**Response:** Created route object (201)

**Error Responses:**
- `400` - Validation errors
- `404` - Referenced entity not found

---

### PUT /superadmin/:id
**Update a route**

**Access:** Superadmin only

**Parameters:**
- `id` (string, required) - Route ID

**Request Body:** Same as POST but all fields optional

**Response:** Updated route object

---

### DELETE /superadmin/:id
**Soft delete a route**

**Access:** Superadmin only

**Parameters:**
- `id` (string, required) - Route ID

**Response:**
```json
{
  "message": "Route deleted successfully"
}
```

**Note:** Sets `deleted: true`, `isActive: false`, and `status: INACTIVE`

---

### PATCH /superadmin/:id/restore
**Restore a soft-deleted route**

**Access:** Superadmin only

**Parameters:**
- `id` (string, required) - Route ID

**Response:**
```json
{
  "message": "Route restored successfully",
  "route": {
    // restored route object
  }
}
```

---

### GET /superadmin/stats/summary
**Get route statistics summary**

**Access:** Superadmin only

**Response:**
```json
{
  "totalRoutes": 150,
  "activeRoutes": 135,
  "inactiveRoutes": 15,
  "totalStops": 750,
  "averageStopsPerRoute": 5.0,
  "routesByOrganization": {
    "Acme Corp": {
      "total": 50,
      "active": 45,
      "totalStops": 250
    },
    "Beta Inc": {
      "total": 30,
      "active": 28,
      "totalStops": 180
    }
  }
}
```

---

## Organization-Scoped Endpoints

### GET /
**Get routes for user's organization**

**Access:** Requires `route:read` permission

**Query Parameters:**
- `page` (number) - Page number for pagination
- `limit` (number) - Items per page
- `status` (string) - Filter by route status
- `shiftId` (string) - Filter by shift
- `vehicleId` (string) - Filter by vehicle
- `isActive` (boolean) - Filter by active status

**Response:** Array of routes in user's organization with full details

---

### GET /unique-locations
**Get routes with unique employee locations**

**Access:** Requires `route:read` permission

**Response:**
```json
[
  {
    "id": "clm123route",
    "name": "Downtown Express",
    "stops": [
      {
        "id": "clm123stop1",
        "employee": {
          "location": "Downtown"
        }
      }
    ],
    "uniqueLocations": ["Downtown", "Midtown", "Uptown"]
  }
]
```

---

### GET /:id
**Get specific route in user's organization**

**Access:** Requires `route:read` permission

**Parameters:**
- `id` (string, required) - Route ID

**Response:** Route object with full details

**Error Responses:**
- `400` - Invalid route ID
- `404` - Route not found or not in user's organization

---

### GET /shift/:shiftId
**Get all routes for a specific shift**

**Access:** Requires `route:read` permission

**Parameters:**
- `shiftId` (string, required) - Shift ID

**Response:** Array of routes for the specified shift

---

### GET /:routeId/stops
**Get all stops for a specific route**

**Access:** Requires `stop:read` permission

**Parameters:**
- `routeId` (string, required) - Route ID

**Response:**
```json
[
  {
    "id": "clm123stop1",
    "name": "Central Plaza",
    "address": "123 Main St",
    "latitude": 40.7128,
    "longitude": -74.0060,
    "sequence": 1,
    "estimatedArrivalTime": "07:45:00.000Z",
    "employee": {
      "id": "clm123emp1",
      "name": "John Doe"
    }
  }
]
```

---

### POST /
**Create a new route in user's organization**

**Access:** Requires `route:create` permission

**Request Body:**
```json
{
  "name": "New Route",
  "description": "Custom route description",
  "vehicleId": "clm123vehicle",
  "shiftId": "clm123shift",
  "startTime": "08:00:00.000Z",
  "endTime": "09:30:00.000Z"
}
```

**Note:** `organizationId` is automatically set to user's active organization

**Response:** Created route object (201)

---

### PUT /:id
**Update route in user's organization**

**Access:** Requires `route:update` permission

**Parameters:**
- `id` (string, required) - Route ID

**Request Body:** Route fields to update

**Response:** Updated route object

---

### DELETE /:id
**Soft delete route in user's organization**

**Access:** Requires `route:delete` permission

**Parameters:**
- `id` (string, required) - Route ID

**Response:** 204 No Content

---

### PATCH /:id/restore
**Restore soft-deleted route**

**Access:** Requires `route:update` and `route:create` permissions

**Parameters:**
- `id` (string, required) - Route ID

**Response:**
```json
{
  "message": "Route restored successfully",
  "route": {
    // restored route object
  }
}
```

---

### PUT /:routeId/stops
**Update the stops assigned to a route**

**Access:** Requires `route:update` permission

**Parameters:**
- `routeId` (string, required) - Route ID

**Request Body:**
```json
{
  "stops": [
    {
      "stopId": "clm123stop1",
      "sequence": 1,
      "estimatedArrivalTime": "07:45:00.000Z"
    },
    {
      "stopId": "clm123stop2",
      "sequence": 2,
      "estimatedArrivalTime": "07:55:00.000Z"
    }
  ]
}
```

**Process:**
1. Disassociates all existing stops from the route
2. Associates new stops with the route in specified order
3. Updates sequence and arrival times

**Response:** Array of updated stops

---

### PATCH /:routeId/stops/:stopId/remove
**Remove a stop from a route**

**Access:** Requires `route:update` permission

**Parameters:**
- `routeId` (string, required) - Route ID
- `stopId` (string, required) - Stop ID

**Response:**
```json
{
  "message": "Stop removed from route successfully"
}
```

---

### PATCH /:routeId/stops/:stopId/add
**Add a stop to a route**

**Access:** Requires `route:update` permission

**Parameters:**
- `routeId` (string, required) - Route ID
- `stopId` (string, required) - Stop ID

**Validation:**
- Stop must not be assigned to another route
- Stop must belong to the same organization

**Response:**
```json
{
  "message": "Stop added to route successfully"
}
```

**Note:** Stop is automatically assigned the next sequence number

---

### PATCH /:id/status
**Update route status**

**Access:** Requires `route:update` permission

**Parameters:**
- `id` (string, required) - Route ID

**Request Body:**
```json
{
  "status": "COMPLETED"
}
```

**Valid Statuses:**
- `PLANNING` - Route is being planned
- `ACTIVE` - Route is currently active
- `IN_PROGRESS` - Route is in progress
- `COMPLETED` - Route has been completed
- `CANCELLED` - Route has been cancelled
- `INACTIVE` - Route is inactive

**Response:**
```json
{
  "message": "Route status updated to COMPLETED"
}
```

---

### GET /stats/summary
**Get route statistics for user's organization**

**Access:** Requires `route:read` permission

**Response:**
```json
{
  "totalRoutes": 25,
  "activeRoutes": 22,
  "inactiveRoutes": 3,
  "totalStops": 125,
  "averageStopsPerRoute": 5.0
}
```

---

## Route Model

### Route Object
```typescript
interface Route {
  id: string;
  name: string;
  description?: string;
  vehicleId?: string;
  shiftId?: string;
  date?: Date;
  startTime?: Date;
  endTime?: Date;
  totalDistance?: number;
  totalTime?: number;
  status: RouteStatus;
  isActive: boolean;
  deleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  organizationId: string;
  
  // Relations
  organization: Organization;
  vehicle?: Vehicle;
  shift?: Shift;
  stops: Stop[];
  vehicleAvailability: VehicleAvailability[];
}
```

### Route Status Values
- `PLANNING` - Route is being planned
- `ACTIVE` - Route is currently active
- `IN_PROGRESS` - Route is in progress
- `COMPLETED` - Route has been completed
- `CANCELLED` - Route has been cancelled
- `INACTIVE` - Route is inactive

### Route Constraints
- **Name:** 1-255 characters, required
- **Description:** Max 1000 characters (optional)
- **Total Time:** 0-180 minutes (optional)
- **Total Distance:** Non-negative number (optional)

---

## Error Handling

### Common Error Responses

**Validation Error (400):**
```json
{
  "message": "Validation failed",
  "errors": [
    {
      "field": "totalTime",
      "message": "Total time cannot exceed 180 minutes"
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
  "message": "Unauthorized"
}
```

**Not Found (404):**
```json
{
  "message": "Route not found"
}
```

**Business Logic Error (400):**
```json
{
  "message": "Route is already deleted"
}
```

---

## Usage Examples

### Creating a Route
```bash
curl -X POST /api/routes \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Morning Commute",
    "description": "Downtown to office complex",
    "vehicleId": "clm123vehicle456",
    "shiftId": "clm123shift789",
    "startTime": "2024-01-15T07:30:00.000Z",
    "endTime": "2024-01-15T09:00:00.000Z",
    "totalTime": 90
  }'
```

### Getting Routes for a Shift
```bash
curl -X GET /api/routes/shift/clm123shift789 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Updating Route Stops
```bash
curl -X PUT /api/routes/clm123route456/stops \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "stops": [
      {
        "stopId": "clm123stop1",
        "sequence": 1,
        "estimatedArrivalTime": "2024-01-15T07:45:00.000Z"
      },
      {
        "stopId": "clm123stop2",
        "sequence": 2,
        "estimatedArrivalTime": "2024-01-15T08:00:00.000Z"
      }
    ]
  }'
```

### Updating Route Status
```bash
curl -X PATCH /api/routes/clm123route456/status \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "IN_PROGRESS"
  }'
```

### Getting Route Statistics
```bash
curl -X GET /api/routes/stats/summary \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Adding a Stop to Route
```bash
curl -X PATCH /api/routes/clm123route456/stops/clm123stop789/add \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Removing a Stop from Route
```bash
curl -X PATCH /api/routes/clm123route456/stops/clm123stop789/remove \
  -H "Authorization: Bearer YOUR_TOKEN"
```
