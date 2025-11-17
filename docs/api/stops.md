# Stops API

## Overview
The Stops API manages transportation stop locations where employees are picked up or dropped off within the fleet management system. Stops represent physical locations along routes with geographical coordinates, employee assignments, and scheduling information.

## Base Route
```
/api/stops
```

## Authentication & Permissions
- All endpoints require authentication
- Superadmin routes require `superadmin` role
- Organization-scoped routes require appropriate stop permissions (`stop.read`, `stop.create`, `stop.update`, `stop.delete`)
- Employee assignment requires additional `employee.assign` permission

---

## Superadmin Endpoints

### GET /superadmin
**Get all stops across all organizations**

**Authentication:** Required  
**Permissions:** `superadmin` role  
**Access:** Global - returns stops from all organizations

**Request:**
```http
GET /api/stops/superadmin
```

**Response:**
```json
[
  {
    "id": "stop_123",
    "name": "Central Plaza",
    "address": "123 Main Street, Downtown",
    "latitude": 40.7128,
    "longitude": -74.0060,
    "sequence": 1,
    "order": 1,
    "estimatedArrivalTime": "2024-09-04T07:45:00.000Z",
    "createdAt": "2024-08-15T10:30:00.000Z",
    "updatedAt": "2024-08-15T10:30:00.000Z",
    "routeId": "route_456",
    "organizationId": "org_789",
    "organization": {
      "id": "org_789",
      "name": "Transport Company Inc"
    },
    "route": {
      "id": "route_456",
      "name": "Downtown Route",
      "vehicle": {
        "id": "vehicle_101",
        "name": "Bus #1",
        "plateNumber": "ABC-123"
      },
      "shift": {
        "id": "shift_202",
        "name": "Morning Shift"
      }
    },
    "employee": {
      "id": "emp_303",
      "name": "John Doe",
      "user": {
        "id": "user_404",
        "name": "John Doe",
        "email": "john.doe@company.com"
      },
      "department": {
        "id": "dept_505",
        "name": "Engineering"
      },
      "shift": {
        "id": "shift_202",
        "name": "Morning Shift"
      }
    }
  }
]
```

**Features:**
- Complete stop data with relationships
- Employee assignments with user details
- Route and vehicle information
- Organization context
- Geographical coordinates for mapping
    "route": {
      "id": "clm123route",
      "name": "Downtown Express",
      "status": "ACTIVE"
    },
    "employee": {
      "id": "clm123emp1",
      "name": "John Doe",
      "email": "john.doe@acme.com",
      "deleted": false,
      "user": {
        "id": "clm123user1",
        "name": "John Doe",
        "email": "john.doe@acme.com"
      },
      "department": {
        "id": "clm123dept",
        "name": "Engineering"
      },
      "shift": {
        "id": "clm123shift",
        "name": "Morning Shift"
      }
    }
  }
]
```

---

### GET /superadmin/:id
**Get specific stop by ID**

**Access:** Superadmin only

**Parameters:**
- `id` (string, required) - Stop ID (CUID)

**Response:**
```json
{
  "id": "clm123stop456",
  "name": "Central Plaza",
  "description": "Main downtown pickup point",
  "address": "123 Main Street, Downtown",
  "latitude": 40.7128,
  "longitude": -74.0060,
  "sequence": 1,
  "order": 1,
  "estimatedArrivalTime": "07:45:00.000Z",
  "isActive": true,
  "deleted": false,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z",
  "routeId": "clm123route",
  "organizationId": "clm123org",
  "organization": {
    "id": "clm123org",
    "name": "Acme Corp"
  },
  "route": {
    "id": "clm123route",
    "name": "Downtown Express",
    "vehicle": {
      "id": "clm123vehicle",
      "plateNumber": "ABC-123",
      "name": "Van #1"
    },
    "shift": {
      "id": "clm123shift",
      "name": "Morning Shift"
    }
  },
  "employee": {
    "id": "clm123emp1",
    "name": "John Doe",
    "email": "john.doe@acme.com",
    "user": {
      "id": "clm123user1",
      "name": "John Doe",
      "email": "john.doe@acme.com"
    },
    "department": {
      "id": "clm123dept",
      "name": "Engineering"
    },
    "shift": {
      "id": "clm123shift",
      "name": "Morning Shift"
    }
  }
}
```

**Error Responses:**
- `400` - Invalid stop ID
- `404` - Stop not found

---

### GET /superadmin/by-organization/:organizationId
**Get all stops for a specific organization**

**Access:** Superadmin only

**Parameters:**
- `organizationId` (string, required) - Organization ID

**Response:** Array of stops for the specified organization, ordered by route and sequence

---

### GET /superadmin/by-route/:routeId
**Get all stops for a specific route**

**Access:** Superadmin only

**Parameters:**
- `routeId` (string, required) - Route ID

**Response:** Array of stops for the specified route, ordered by sequence

---

### POST /superadmin
**Create a new stop**

**Access:** Superadmin only

**Request Body:**
```json
{
  "name": "City Center",
  "description": "Central business district pickup",
  "address": "456 Broadway, City Center",
  "latitude": 40.7589,
  "longitude": -73.9851,
  "sequence": 2,
  "order": 2,
  "estimatedArrivalTime": "08:00:00.000Z",
  "isActive": true,
  "routeId": "clm123route",
  "organizationId": "clm123org"
}
```

**Required Fields:**
- `name` (string, 1-255 characters)
- `address` (string, 1-500 characters)
- `organizationId` (string, valid CUID)

**Optional Fields:**
- `description` (string, max 1000 characters)
- `latitude` (number, -90 to 90)
- `longitude` (number, -180 to 180)
- `sequence` (integer ≥ 0)
- `order` (integer ≥ 0)
- `estimatedArrivalTime` (ISO datetime)
- `isActive` (boolean, default: true)
- `routeId` (string, valid CUID)

**Validation:**
- Organization must exist
- Route must exist and belong to same organization if provided
- Coordinates must be valid if provided
- Sequence/order must be unique within route if provided

**Response:** Created stop object (201)

**Error Responses:**
- `400` - Validation errors
- `404` - Referenced entity not found
- `409` - Sequence/order conflict within route

---

### PUT /superadmin/:id
**Update a stop**

**Access:** Superadmin only

**Parameters:**
- `id` (string, required) - Stop ID

**Request Body:** Same as POST but all fields optional except constraints

**Response:** Updated stop object

---

### DELETE /superadmin/:id
**Soft delete a stop**

**Access:** Superadmin only

**Parameters:**
- `id` (string, required) - Stop ID

**Query Parameters:**
- `force` (boolean) - Force delete even if stop has assigned employees

**Validation:**
- Cannot delete stop with assigned employees unless `force=true`
- Removes stop from route and unassigns employees if force deleted

**Response:**
```json
{
  "message": "Stop deleted successfully"
}
```

---

### PATCH /superadmin/:id/assign-employee
**Assign or unassign employee to a stop**

**Access:** Superadmin only

**Parameters:**
- `id` (string, required) - Stop ID

**Request Body:**
```json
{
  "employeeId": "clm123emp1" // or null to unassign
}
```

**Response:**
```json
{
  "message": "Employee assigned to stop successfully",
  "stop": {
    // updated stop object
  }
}
```

**Validation:**
- Employee must exist and belong to same organization
- Employee can only be assigned to one stop at a time

---

### PATCH /superadmin/:id/reorder
**Update stop sequence/order within route**

**Access:** Superadmin only

**Parameters:**
- `id` (string, required) - Stop ID

**Request Body:**
```json
{
  "sequence": 3,
  "order": 3
}
```

**Response:**
```json
{
  "message": "Stop reordered successfully",
  "stop": {
    // updated stop object
  }
}
```

---

### GET /superadmin/stats/summary
**Get stop statistics summary**

**Access:** Superadmin only

**Response:**
```json
{
  "totalStops": 200,
  "activeStops": 185,
  "inactiveStops": 15,
  "stopsWithEmployees": 150,
  "stopsWithoutEmployees": 50,
  "stopsWithRoutes": 160,
  "stopsWithoutRoutes": 40,
  "byOrganization": [
    {
      "organizationId": "clm123org1",
      "organizationName": "Acme Corp",
      "stopCount": 75,
      "activeStops": 70,
      "assignedStops": 60
    }
  ],
  "byRoute": [
    {
      "routeId": "clm123route1",
      "routeName": "Downtown Express",
      "organizationName": "Acme Corp",
      "stopCount": 8,
      "averageSequence": 4.5
    }
  ],
  "geographicalSpread": {
    "northernmost": 40.8000,
    "southernmost": 40.7000,
    "easternmost": -73.9000,
    "westernmost": -74.1000,
    "centerLatitude": 40.7500,
    "centerLongitude": -74.0000
  }
}
```

---

## Organization-Scoped Endpoints

### GET /
**Get stops for user's organization**

**Access:** Authenticated users

**Query Parameters:**
- `page` (number) - Page number for pagination
- `limit` (number) - Items per page
- `search` (string) - Search by name or address
- `routeId` (string) - Filter by route
- `hasEmployee` (boolean) - Filter by employee assignment
- `isActive` (boolean) - Filter by active status
- `latitude` (number) - Center latitude for proximity search
- `longitude` (number) - Center longitude for proximity search
- `radius` (number) - Search radius in kilometers

**Response:** Paginated array of stops in user's organization

---

### GET /:id
**Get specific stop in user's organization**

**Access:** Authenticated users

**Parameters:**
- `id` (string, required) - Stop ID

**Response:** Stop object with full details

**Error Responses:**
- `400` - Invalid stop ID
- `404` - Stop not found or not in user's organization

---

### GET /by-route/:routeId
**Get all stops for a specific route**

**Access:** Authenticated users

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
**Create a new stop in user's organization**

**Access:** Requires `stop:create` permission

**Request Body:**
```json
{
  "name": "New Stop",
  "description": "Description of the stop",
  "address": "789 Oak Street",
  "latitude": 40.7500,
  "longitude": -73.9800,
  "routeId": "clm123route"
}
```

**Note:** `organizationId` is automatically set to user's active organization

**Response:** Created stop object (201)

---

### PUT /:id
**Update stop in user's organization**

**Access:** Requires `stop:update` permission

**Parameters:**
- `id` (string, required) - Stop ID

**Request Body:** Stop fields to update

**Response:** Updated stop object

---

### DELETE /:id
**Soft delete stop in user's organization**

**Access:** Requires `stop:delete` permission

**Parameters:**
- `id` (string, required) - Stop ID

**Query Parameters:**
- `force` (boolean) - Force delete even if stop has assigned employees

**Response:**
```json
{
  "message": "Stop deleted successfully"
}
```

---

### PATCH /:id/assign-employee
**Assign employee to stop**

**Access:** Requires `stop:update` permission

**Parameters:**
- `id` (string, required) - Stop ID

**Request Body:**
```json
{
  "employeeId": "clm123emp1"
}
```

**Response:**
```json
{
  "message": "Employee assigned to stop successfully",
  "stop": {
    // updated stop object
  }
}
```

---

### PATCH /:id/reorder
**Update stop sequence within route**

**Access:** Requires `stop:update` permission

**Parameters:**
- `id` (string, required) - Stop ID

**Request Body:**
```json
{
  "sequence": 2,
  "order": 2
}
```

**Response:**
```json
{
  "message": "Stop reordered successfully"
}
```

---

### GET /nearby
**Get stops near a location**

**Access:** Authenticated users

**Query Parameters:**
- `latitude` (number, required) - Center latitude
- `longitude` (number, required) - Center longitude
- `radius` (number) - Search radius in kilometers (default: 5)
- `limit` (number) - Maximum results (default: 20)

**Response:**
```json
[
  {
    "id": "clm123stop1",
    "name": "Central Plaza",
    "address": "123 Main St",
    "latitude": 40.7128,
    "longitude": -74.0060,
    "distance": 1.2
  }
]
```

---

### GET /unassigned
**Get stops without assigned employees**

**Access:** Authenticated users

**Query Parameters:**
- `routeId` (string) - Filter by specific route

**Response:** Array of stops without employee assignments

---

## Stop Model

### Stop Object
```typescript
interface Stop {
  id: string;
  name: string;
  description?: string;
  address: string;
  latitude?: number;
  longitude?: number;
  sequence?: number;
  order?: number;
  estimatedArrivalTime?: Date;
  isActive: boolean;
  deleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  routeId?: string;
  organizationId: string;
  
  // Relations
  organization: Organization;
  route?: Route;
  employee?: Employee;
}
```

### Stop Constraints
- **Name:** 1-255 characters, required
- **Address:** 1-500 characters, required
- **Description:** Max 1000 characters (optional)
- **Latitude:** -90 to 90 degrees (optional)
- **Longitude:** -180 to 180 degrees (optional)
- **Sequence/Order:** Non-negative integers, unique within route

---

## Error Handling

### Common Error Responses

**Validation Error (400):**
```json
{
  "message": "Validation failed",
  "errors": [
    {
      "field": "latitude",
      "message": "Latitude must be between -90 and 90"
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
  "message": "Stop not found"
}
```

**Conflict (409):**
```json
{
  "message": "Stop sequence already exists in this route"
}
```

**Business Logic Error (400):**
```json
{
  "message": "Cannot delete stop with assigned employees. Use force=true to override"
}
```

---

## Usage Examples

### Creating a Stop
```bash
curl -X POST /api/stops \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Tech Hub",
    "description": "Technology district pickup point",
    "address": "456 Innovation Blvd",
    "latitude": 40.7300,
    "longitude": -74.0100,
    "routeId": "clm123route456"
  }'
```

### Finding Nearby Stops
```bash
curl -X GET "/api/stops/nearby?latitude=40.7128&longitude=-74.0060&radius=2&limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Assigning Employee to Stop
```bash
curl -X PATCH /api/stops/clm123stop456/assign-employee \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "employeeId": "clm123emp789"
  }'
```

### Reordering Stops in Route
```bash
curl -X PATCH /api/stops/clm123stop456/reorder \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "sequence": 3,
    "order": 3
  }'
```

### Getting Stops by Route
```bash
curl -X GET /api/stops/by-route/clm123route456 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Getting Unassigned Stops
```bash
curl -X GET "/api/stops/unassigned?routeId=clm123route456" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Searching Stops
```bash
curl -X GET "/api/stops?search=downtown&hasEmployee=false&isActive=true&page=1&limit=20" \
  -H "Authorization: Bearer YOUR_TOKEN"
```
