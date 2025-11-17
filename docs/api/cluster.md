# Cluster API

## Overview
The Cluster API provides advanced route optimization and clustering capabilities, integrating with external clustering services to create optimal transportation routes based on employee locations, vehicle availability, and various constraints.

## Base Route
```
/api/cluster
```

## Authentication & Permissions
- All endpoints require authentication
- Requires appropriate route and clustering permissions
- Organization-scoped operations only
- Integration with external FastAPI clustering service

---

## Endpoints

### GET /
**Health check for cluster routes**

**Access:** Requires `route:read` permission

**Response:**
```json
{
  "message": "Cluster routes are working",
  "organizationId": "clm123org456"
}
```

---

### POST /clustering
**Create optimized clusters using clustering service**

**Access:** Requires `route:create` permission

**Request Body:**
```json
{
  "employees": [
    {
      "id": "clm123emp1",
      "name": "John Doe",
      "location": [40.7128, -74.0060],
      "latitude": 40.7128,
      "longitude": -74.0060,
      "address": "123 Main St, NYC"
    },
    {
      "id": "clm123emp2",
      "name": "Jane Smith",
      "location": [40.7589, -73.9851],
      "latitude": 40.7589,
      "longitude": -73.9851,
      "address": "456 Broadway, NYC"
    }
  ],
  "vehicles": [
    {
      "id": "clm123vehicle1",
      "name": "Van #1",
      "capacity": 12,
      "plateNumber": "ABC-123",
      "type": "VAN"
    },
    {
      "id": "clm123vehicle2",
      "name": "Bus #1",
      "capacity": 25,
      "plateNumber": "XYZ-789",
      "type": "BUS"
    }
  ]
}
```

**Process:**
1. Validates all employees belong to user's organization
2. Validates all vehicles belong to user's organization and are available
3. Forwards request to external FastAPI clustering service
4. Returns optimized clustering results

**Response:**
```json
{
  "clusters": [
    {
      "id": "cluster_1",
      "vehicle": {
        "id": "clm123vehicle1",
        "name": "Van #1",
        "capacity": 12
      },
      "employees": [
        {
          "id": "clm123emp1",
          "name": "John Doe",
          "location": [40.7128, -74.0060]
        }
      ],
      "route": {
        "coordinates": [[40.7128, -74.0060], [40.7589, -73.9851]],
        "distance": 5.2,
        "duration": 18,
        "stops": [
          {
            "employeeId": "clm123emp1",
            "sequence": 1,
            "arrivalTime": "07:45:00",
            "coordinates": [40.7128, -74.0060]
          }
        ]
      },
      "metrics": {
        "totalDistance": 5.2,
        "totalDuration": 18,
        "efficiency": 0.85,
        "vehicleUtilization": 0.75
      }
    }
  ],
  "optimization": {
    "totalDistance": 15.6,
    "totalDuration": 45,
    "totalVehicles": 2,
    "totalEmployees": 8,
    "efficiency": 0.82,
    "savings": {
      "distance": 3.2,
      "time": 12,
      "percentage": 18.5
    }
  }
}
```

**Error Responses:**
- `400` - Invalid employee/vehicle data or organization mismatch
- `401` - Missing session token
- `500` - Clustering service error

---

### POST /optimize
**Get optimal clusters for a shift**

**Access:** Requires `route:read` permission

**Request Body:**
```json
{
  "shiftId": "clm123shift456",
  "date": "2024-01-15"
}
```

**Process:**
1. Validates shift belongs to user's organization
2. Finds available vehicles for the shift on specified date
3. Gets employees assigned to the shift without stop assignments
4. Calls external clustering service for optimization
5. Returns optimized clusters

**Response:**
```json
{
  "shift": {
    "id": "clm123shift456",
    "name": "Morning Shift",
    "startTime": "08:00:00",
    "endTime": "17:00:00"
  },
  "date": "2024-01-15",
  "availableVehicles": [
    {
      "id": "clm123vehicle1",
      "name": "Van #1",
      "capacity": 12,
      "plateNumber": "ABC-123"
    }
  ],
  "unassignedEmployees": [
    {
      "id": "clm123emp1",
      "name": "John Doe",
      "location": [40.7128, -74.0060]
    }
  ],
  "optimizedClusters": [
    {
      "vehicleId": "clm123vehicle1",
      "employees": ["clm123emp1", "clm123emp2"],
      "route": {
        "stops": [
          {
            "employeeId": "clm123emp1",
            "coordinates": [40.7128, -74.0060],
            "sequence": 1
          }
        ],
        "totalDistance": 8.5,
        "totalTime": 25
      }
    }
  ]
}
```

---

### POST /shift/:shiftId/vehicle/:vehicleId
**Create clusters for specific shift and vehicle**

**Access:** Requires `route:create` permission

**Parameters:**
- `shiftId` (string, required) - Shift ID
- `vehicleId` (string, required) - Vehicle ID

**Request Body:**
```json
{
  "date": "2024-01-15",
  "employeeIds": ["clm123emp1", "clm123emp2", "clm123emp3"],
  "optimizationSettings": {
    "maxTravelTime": 90,
    "maxDetourRatio": 1.5,
    "prioritizeClosestFirst": true
  }
}
```

**Response:**
```json
{
  "cluster": {
    "shiftId": "clm123shift456",
    "vehicleId": "clm123vehicle1",
    "date": "2024-01-15",
    "employees": [
      {
        "id": "clm123emp1",
        "name": "John Doe",
        "stopSequence": 1,
        "estimatedPickupTime": "07:45:00"
      }
    ],
    "route": {
      "totalDistance": 12.5,
      "totalTime": 35,
      "stops": [
        {
          "employeeId": "clm123emp1",
          "coordinates": [40.7128, -74.0060],
          "sequence": 1,
          "arrivalTime": "07:45:00"
        }
      ]
    },
    "vehicleAvailability": {
      "id": "clm123avail1",
      "available": true,
      "assignedRoute": "clm123route1"
    }
  }
}
```

---

### POST /availability/:vehicleId/:shiftId
**Create or update vehicle availability for clustering**

**Access:** Requires `vehicle:update` permission

**Parameters:**
- `vehicleId` (string, required) - Vehicle ID
- `shiftId` (string, required) - Shift ID

**Request Body:**
```json
{
  "date": "2024-01-15",
  "available": true,
  "startTime": "07:00:00",
  "endTime": "09:00:00",
  "notes": "Available for morning routes",
  "maxCapacity": 12,
  "restrictions": ["no_highway", "downtown_only"]
}
```

**Response:**
```json
{
  "vehicleAvailability": {
    "id": "clm123avail1",
    "vehicleId": "clm123vehicle1",
    "shiftId": "clm123shift456",
    "date": "2024-01-15T00:00:00.000Z",
    "available": true,
    "startTime": "07:00:00.000Z",
    "endTime": "09:00:00.000Z",
    "notes": "Available for morning routes",
    "maxCapacity": 12,
    "restrictions": ["no_highway", "downtown_only"],
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  },
  "message": "Vehicle availability updated successfully"
}
```

---

### GET /available-vehicles/:shiftId
**Get available vehicles for a specific shift**

**Access:** Requires `vehicle:read` permission

**Parameters:**
- `shiftId` (string, required) - Shift ID

**Query Parameters:**
- `date` (string, required) - Date in YYYY-MM-DD format
- `capacity` (number) - Minimum vehicle capacity
- `type` (string) - Vehicle type filter

**Response:**
```json
[
  {
    "id": "clm123vehicle1",
    "name": "Van #1",
    "plateNumber": "ABC-123",
    "capacity": 12,
    "type": "VAN",
    "status": "AVAILABLE",
    "category": {
      "id": "clm123cat1",
      "name": "Large Van",
      "capacity": 12
    },
    "driver": {
      "id": "clm123driver1",
      "name": "Mike Johnson",
      "licenseNumber": "DL123456"
    },
    "availability": {
      "id": "clm123avail1",
      "available": true,
      "startTime": "07:00:00.000Z",
      "endTime": "09:00:00.000Z"
    }
  }
]
```

---

## Clustering Algorithms

### Supported Optimization Methods
- **K-means clustering** - Groups employees by proximity
- **Capacity constraints** - Ensures vehicle capacity limits
- **Travel time optimization** - Minimizes total travel time
- **Distance optimization** - Minimizes total distance
- **Load balancing** - Distributes employees evenly across vehicles

### Optimization Parameters
- `maxTravelTime` - Maximum travel time per route (default: 90 minutes)
- `maxDetourRatio` - Maximum detour allowed (default: 1.5x direct distance)
- `prioritizeClosestFirst` - Whether to prioritize closest employees
- `allowSplitShifts` - Whether employees can be split across multiple vehicles
- `considerTrafficPatterns` - Include traffic data in optimization

---

## Integration with External Services

### FastAPI Clustering Service
The cluster API integrates with an external FastAPI service for advanced optimization:

**Service URL:** Configured via `FASTAPI_URL` environment variable

**Authentication:** Forwards Better Auth session tokens

**Data Format:** Converts internal employee/vehicle data to clustering service format

---

## Error Handling

### Common Error Responses

**Validation Error (400):**
```json
{
  "message": "Validation failed",
  "errors": [
    {
      "field": "employees",
      "message": "At least one employee is required"
    }
  ]
}
```

**Organization Mismatch (400):**
```json
{
  "message": "Some employees do not belong to this organization"
}
```

**Vehicle Unavailable (400):**
```json
{
  "message": "Some vehicles do not belong to this organization or are not available"
}
```

**Service Error (500):**
```json
{
  "message": "Error calling clustering service",
  "details": "Clustering service responded with status: 500"
}
```

---

## Usage Examples

### Basic Clustering Request
```bash
curl -X POST /api/cluster/clustering \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "employees": [
      {
        "id": "clm123emp1",
        "name": "John Doe",
        "location": [40.7128, -74.0060],
        "latitude": 40.7128,
        "longitude": -74.0060
      }
    ],
    "vehicles": [
      {
        "id": "clm123vehicle1",
        "name": "Van #1",
        "capacity": 12,
        "plateNumber": "ABC-123"
      }
    ]
  }'
```

### Optimize Shift
```bash
curl -X POST /api/cluster/optimize \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "shiftId": "clm123shift456",
    "date": "2024-01-15"
  }'
```

### Set Vehicle Availability
```bash
curl -X POST /api/cluster/availability/clm123vehicle1/clm123shift456 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "date": "2024-01-15",
    "available": true,
    "startTime": "07:00:00",
    "endTime": "09:00:00",
    "maxCapacity": 12
  }'
```

### Get Available Vehicles
```bash
curl -X GET "/api/cluster/available-vehicles/clm123shift456?date=2024-01-15&capacity=10" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Create Specific Vehicle Cluster
```bash
curl -X POST /api/cluster/shift/clm123shift456/vehicle/clm123vehicle1 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "date": "2024-01-15",
    "employeeIds": ["clm123emp1", "clm123emp2"],
    "optimizationSettings": {
      "maxTravelTime": 90,
      "prioritizeClosestFirst": true
    }
  }'
```
