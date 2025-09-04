# Vehicle Categories API

## Overview
The Vehicle Categories API manages vehicle categorization and classification within the fleet management system. Categories help organize vehicles by type, capacity, and purpose, enabling better fleet organization and resource allocation.

## Base Route
```
/api/vehicle-categories
```

## Authentication & Permissions
- All endpoints require authentication
- Superadmin routes require `superadmin` role
- Organization-scoped routes require appropriate vehicle category permissions

---

## Superadmin Endpoints

### GET /superadmin
**Get all vehicle categories across all organizations**

**Authentication:** Required  
**Permissions:** `superadmin` role  
**Access:** Global - returns categories from all organizations

**Request:**
```http
GET /api/vehicle-categories/superadmin
```

**Response:**
```json
[
  {
    "id": "cat_123",
    "name": "Passenger Van",
    "capacity": 12,
    "organizationId": "org_456",
    "createdAt": "2024-08-15T10:30:00.000Z",
    "updatedAt": "2024-08-15T10:30:00.000Z",
    "organization": {
      "id": "org_456",
      "name": "Transport Company Inc"
    },
    "vehicles": [
      {
        "id": "vehicle_789",
        "name": "Van #1",
        "plateNumber": "ABC-123",
        "deleted": false
      }
    ],
    "vehicleRequests": [
      {
        "id": "req_456",
        "name": "New Van Request",
        "status": "PENDING"
      }
    ],
    "_count": {
      "vehicles": 5,
      "vehicleRequests": 2
    }
  }
]
```

**Features:**
- Complete category data with relationships
- Vehicle and request counts
- Organization information
- Includes both active and associated entities
- Ordered by creation date (newest first)

---

### GET /superadmin/:id
**Get specific vehicle category by ID**

**Authentication:** Required  
**Permissions:** `superadmin` role  
**Access:** Global - can access any organization's categories

**Request:**
```http
GET /api/vehicle-categories/superadmin/cat_123
```

**Response:** Complete vehicle category object with organization and relationship details

---

### GET /superadmin/by-organization/:organizationId
**Get vehicle categories for specific organization**

**Authentication:** Required  
**Permissions:** `superadmin` role  
**Access:** Global - can query any organization's categories

**Request:**
```http
GET /api/vehicle-categories/superadmin/by-organization/org_456
```

**Response:** Array of vehicle categories for the specified organization

---

### POST /superadmin
**Create a new vehicle category for any organization**

**Authentication:** Required  
**Permissions:** `superadmin` role  
**Access:** Global - can create categories for any organization

**Request:**
```http
POST /api/vehicle-categories/superadmin
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "Large Bus",
  "capacity": 40,
  "organizationId": "org_456"
}
```

**Required Fields:**
- `name` (string) - Category name (unique within organization)
- `capacity` (number > 0) - Vehicle capacity for this category
- `organizationId` (string) - Target organization ID

**Validation:**
- Organization must exist
- Category name must be unique within organization
- Capacity must be positive integer
- Name is automatically trimmed

**Response (201):**
```json
{
  "id": "cat_new123",
  "name": "Large Bus",
  "capacity": 40,
  "organizationId": "org_456",
  "createdAt": "2024-09-04T12:30:00.000Z",
  "updatedAt": "2024-09-04T12:30:00.000Z",
  "organization": {
    "id": "org_456",
    "name": "Transport Company Inc"
  },
  "_count": {
    "vehicles": 0,
    "vehicleRequests": 0
  }
}
```

**Error Responses:**
- `400` - Validation errors (missing fields, invalid values)
- `404` - Organization not found
- `409` - Category name already exists in organization
- `500` - Internal server error

---

### PUT /superadmin/:id
**Update vehicle category (Global)**

**Authentication:** Required  
**Permissions:** `superadmin` role  
**Access:** Global - can update any organization's categories

**Request:**
```http
PUT /api/vehicle-categories/superadmin/cat_123
Content-Type: application/json
```

**Request Body:** (All fields optional)
```json
{
  "name": "Updated Large Bus",
  "capacity": 45
}
```

**Response:** Updated vehicle category object

---

### DELETE /superadmin/:id
**Delete vehicle category (Global)**

**Authentication:** Required  
**Permissions:** `superadmin` role  
**Access:** Global - can delete any organization's categories

**Request:**
```http
DELETE /api/vehicle-categories/superadmin/cat_123
```

**Business Logic:**
- Prevents deletion if category has associated vehicles or requests
- Provides detailed information about blocking relationships

**Response:** `204 No Content`

---

### GET /superadmin/:id/vehicles
**Get all vehicles in specific category**

**Authentication:** Required  
**Permissions:** `superadmin` role  
**Access:** Global - can view vehicles across organizations

**Request:**
```http
GET /api/vehicle-categories/superadmin/cat_123/vehicles?includeDeleted=true
```

**Query Parameters:**
- `includeDeleted` (boolean) - Include soft-deleted vehicles (default: false)

**Response:**
```json
{
  "category": {
    "id": "cat_123",
    "name": "Passenger Van",
    "capacity": 12
  },
  "vehicles": [
    {
      "id": "vehicle_789",
      "name": "Van #1",
      "plateNumber": "ABC-123",
      "status": "AVAILABLE",
      "deleted": false,
      "driver": {...},
      "organization": {...},
      "routes": [...]
    }
  ],
  "totalCount": 5
}
```

**Features:**
- Complete vehicle details with relationships
- Optional inclusion of deleted vehicles
- Category context information
- Total count for pagination planning

---

### GET /superadmin/:id/requests
**Get all vehicle requests for specific category**

**Authentication:** Required  
**Permissions:** `superadmin` role  
**Access:** Global - can view requests across organizations

**Request:**
```http
GET /api/vehicle-categories/superadmin/cat_123/requests
```

**Response:** Array of vehicle requests targeting this category

---

### GET /superadmin/stats/summary
**Get comprehensive vehicle category statistics**

**Authentication:** Required  
**Permissions:** `superadmin` role  
**Access:** Global analytics across all organizations

**Request:**
```http
GET /api/vehicle-categories/superadmin/stats/summary
```

**Response:**
```json
{
  "totalCategories": 25,
  "totalVehicles": 150,
  "totalRequests": 12,
  "averageCapacity": 18,
  "categoriesByOrganization": {
    "Transport Company Inc": {
      "categories": 8,
      "vehicles": 45,
      "requests": 3
    },
    "Logistics Corp": {
      "categories": 6,
      "vehicles": 32,
      "requests": 2
    }
  },
  "topCategories": [
    {
      "id": "cat_popular",
      "name": "Standard Van",
      "organization": "Transport Company Inc",
      "vehicleCount": 25,
      "capacity": 12
    }
  ]
}
```

**Features:**
- Global category and vehicle statistics
- Organization-wise breakdown
- Average capacity calculation
- Top categories by vehicle count
- Request volume analysis

---

## Organization-Scoped Endpoints

### GET /
**Get vehicle categories for user's organization**

**Authentication:** Required  
**Permissions:** `vehicleCategory.read`  
**Organization Context:** Uses `activeOrganizationId` from session

**Request:**
```http
GET /api/vehicle-categories
```

**Response:**
```json
[
  {
    "id": "cat_456",
    "name": "Delivery Van",
    "capacity": 8,
    "organizationId": "org_456",
    "createdAt": "2024-08-20T09:15:00.000Z",
    "updatedAt": "2024-08-20T09:15:00.000Z"
  },
  {
    "id": "cat_789",
    "name": "Passenger Bus",
    "capacity": 25,
    "organizationId": "org_456",
    "createdAt": "2024-08-18T14:30:00.000Z",
    "updatedAt": "2024-08-18T14:30:00.000Z"
  }
]
```

**Features:**
- Returns only categories from user's active organization
- Simple list without complex relationships for performance
- Ordered alphabetically by name
- Clean, lightweight response

**Error Responses:**
- `400` - Active organization not found in session
- `403` - Insufficient permissions
- `500` - Internal server error

---

### GET /:id
**Get specific vehicle category in user's organization**

**Authentication:** Required  
**Permissions:** `vehicleCategory.read`  
**Organization Context:** Category must belong to user's active organization

**Request:**
```http
GET /api/vehicle-categories/cat_456
```

**Path Parameters:**
- `id` (string, required) - Vehicle category ID

**Response:**
```json
{
  "id": "cat_456",
  "name": "Delivery Van",
  "capacity": 8,
  "organizationId": "org_456",
  "createdAt": "2024-08-20T09:15:00.000Z",
  "updatedAt": "2024-08-20T09:15:00.000Z",
  "vehicles": [
    {
      "id": "vehicle_123",
      "name": "Delivery Van #1",
      "plateNumber": "DEL-001",
      "status": "AVAILABLE",
      "deleted": false
    },
    {
      "id": "vehicle_124",
      "name": "Delivery Van #2", 
      "plateNumber": "DEL-002",
      "status": "IN_USE",
      "deleted": false
    }
  ]
}
```

**Features:**
- Complete category details
- Associated vehicles in the organization
- Organization-scoped access control
- Excludes deleted vehicles from vehicle list

**Error Responses:**
- `400` - Active organization not found in session
- `403` - Insufficient permissions
- `404` - Category not found in organization
- `500` - Internal server error

---

### POST /
**Create a new vehicle category in user's organization**

**Authentication:** Required  
**Permissions:** `vehicleCategory.create`  
**Organization Context:** Category automatically assigned to user's active organization

**Request:**
```http
POST /api/vehicle-categories
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "Emergency Vehicle",
  "capacity": 4
}
```

**Required Fields:**
- `name` (string) - Category name (unique within organization)
- `capacity` (number > 0) - Vehicle capacity for this category

**Validation:**
- Category name must be unique within organization
- Name is automatically trimmed of whitespace
- Capacity must be positive integer
- Organization ID automatically set from session

**Response (201):**
```json
{
  "id": "cat_emergency123",
  "name": "Emergency Vehicle",
  "capacity": 4,
  "organizationId": "org_456",
  "createdAt": "2024-09-04T13:45:00.000Z",
  "updatedAt": "2024-09-04T13:45:00.000Z"
}
```

**Error Responses:**
- `400` - Active organization not found or validation errors
- `403` - Insufficient permissions
- `409` - Category name already exists in organization
- `500` - Internal server error

---

### PUT /:id
**Update vehicle category in user's organization**

**Authentication:** Required  
**Permissions:** `vehicleCategory.update`  
**Organization Context:** Category must belong to user's active organization

**Request:**
```http
PUT /api/vehicle-categories/cat_456
Content-Type: application/json
```

**Path Parameters:**
- `id` (string, required) - Vehicle category ID

**Request Body:** (All fields optional)
```json
{
  "name": "Updated Delivery Van",
  "capacity": 10
}
```

**Optional Fields:**
- `name` (string) - Updated category name
- `capacity` (number > 0) - Updated capacity

**Validation:**
- Category must exist in user's organization
- If name is changed, new name must be unique within organization
- Name automatically trimmed if provided
- Partial updates supported (only provided fields updated)

**Response:**
```json
{
  "id": "cat_456",
  "name": "Updated Delivery Van",
  "capacity": 10,
  "organizationId": "org_456",
  "updatedAt": "2024-09-04T14:00:00.000Z"
}
```

**Error Responses:**
- `400` - Active organization not found or validation errors
- `403` - Insufficient permissions
- `404` - Category not found in organization
- `409` - Name conflict within organization
- `500` - Internal server error

---

### DELETE /:id
**Delete vehicle category in user's organization**

**Authentication:** Required  
**Permissions:** `vehicleCategory.delete`  
**Organization Context:** Category must belong to user's active organization

**Request:**
```http
DELETE /api/vehicle-categories/cat_456
```

**Path Parameters:**
- `id` (string, required) - Vehicle category ID

**Business Logic:**
- **Referential Integrity Check**: Prevents deletion if category has:
  - Associated vehicles (non-deleted)
  - Associated vehicle requests
- Provides detailed information about blocking relationships
- Complete deletion (not soft delete)

**Response:** `204 No Content` (successful deletion)

**Error Response Examples:**
```json
{
  "message": "Cannot delete category with associated vehicles or requests.",
  "details": {
    "vehicleCount": 3,
    "requestCount": 1
  }
}
```

**Error Responses:**
- `400` - Category has associated vehicles/requests, or active organization not found
- `403` - Insufficient permissions
- `404` - Category not found in organization
- `500` - Internal server error

---

## Vehicle Category Model

```typescript
interface VehicleCategory {
  id: string;
  name: string;
  capacity: number;
  organizationId: string;
  createdAt: Date;
  updatedAt: Date;
  
  // Relations
  organization: Organization;
  vehicles: Vehicle[];
  vehicleRequests: VehicleRequest[];
  
  // Counts (available in some endpoints)
  _count?: {
    vehicles: number;
    vehicleRequests: number;
  };
}
```

### Category Properties
- `name` - Human-readable category name (unique within organization)
- `capacity` - Standard capacity for vehicles in this category
- `organizationId` - Organization owner (automatic in org-scoped routes)

### Relationship Management
- **Vehicles**: All vehicles assigned to this category
- **Vehicle Requests**: Requests specifying this category
- **Organization**: Owning organization context

---

## Key Features

### **Organization Isolation**
- Multi-tenant category management
- Session-based organization context
- Name uniqueness within organization scope
- Cross-organization access prevention

### **Referential Integrity**
- Prevents deletion of categories with dependencies
- Detailed dependency information in error responses
- Vehicle and request relationship tracking
- Data consistency enforcement

### **Fleet Organization**
- Capacity-based vehicle classification
- Category-specific vehicle grouping
- Request targeting by category
- Statistical analysis by category

### **Administrative Oversight**
- Global category management (superadmin)
- Cross-organization statistics and analytics
- Category usage patterns and insights
- Vehicle distribution analysis

### **Performance Optimization**
- Lightweight listing for organization-scoped routes
- Comprehensive details for specific queries
- Efficient counting and aggregation
- Selective relationship loading
