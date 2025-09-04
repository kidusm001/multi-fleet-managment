# Vehicle Requests API

## Overview
The Vehicle Requests API manages the vehicle request and approval workflow, allowing fleet managers to request new vehicles and administrators to approve or reject them. This system provides a structured approval process for adding new vehicles to the fleet.

## Base Route
```
/api/vehicle-requests
```

## Authentication & Permissions
- All endpoints require authentication
- Superadmin routes require `superadmin` role
- Organization-scoped routes require appropriate vehicle request permissions

---

## Superadmin Endpoints

### GET /superadmin
**Get all vehicle requests across all organizations**

**Authentication:** Required  
**Permissions:** `superadmin` role  
**Access:** Global - returns requests from all organizations

**Request:**
```http
GET /api/vehicle-requests/superadmin?organizationId=org_123&status=PENDING&categoryId=cat_456
```

**Query Parameters:**
- `organizationId` (string, optional) - Filter by organization ID
- `status` (ApprovalStatus, optional) - Filter by approval status
- `categoryId` (string, optional) - Filter by vehicle category

**Response:**
```json
[
  {
    "id": "req_123",
    "name": "Fleet Van Request",
    "licensePlate": "NEW-VAN-001",
    "capacity": 15,
    "type": "IN_HOUSE",
    "model": "Transit",
    "vendor": "Ford Dealership",
    "dailyRate": 180.00,
    "status": "PENDING",
    "requestedBy": "fleet_manager",
    "requestedAt": "2024-09-04T10:30:00.000Z",
    "approvedBy": null,
    "approvedAt": null,
    "comment": null,
    "organizationId": "org_456",
    "categoryId": "cat_789",
    "organization": {
      "id": "org_456",
      "name": "Transport Company Inc"
    },
    "category": {
      "id": "cat_789",
      "name": "Passenger Van",
      "description": "Large capacity passenger vehicle"
    }
  }
]
```

**Features:**
- Global search across all organizations
- Multiple filter options
- Complete relationship data
- Ordered by request date (newest first)

---

### GET /superadmin/:id
**Get specific vehicle request by ID**

**Authentication:** Required  
**Permissions:** `superadmin` role  
**Access:** Global - can access any organization's requests

**Request:**
```http
GET /api/vehicle-requests/superadmin/req_123
```

**Response:** Complete vehicle request object with organization and category details

---

### POST /superadmin
**Create a new vehicle request for any organization**

**Authentication:** Required  
**Permissions:** `superadmin` role  
**Access:** Global - can create requests for any organization

**Request:**
```http
POST /api/vehicle-requests/superadmin
Content-Type: application/json
```

**Request Body:**
```json
{
  "organizationId": "org_456",
  "name": "Emergency Response Vehicle",
  "licensePlate": "EMRG-001",
  "capacity": 8,
  "type": "IN_HOUSE",
  "model": "Sprinter",
  "vendor": "Mercedes Dealership",
  "dailyRate": 250.00,
  "requestedBy": "operations_manager",
  "categoryId": "cat_emergency",
  "comment": "Urgent need for emergency response vehicle"
}
```

**Required Fields:**
- `organizationId` (string) - Target organization ID
- `name` (string) - Vehicle name/identifier
- `licensePlate` (string) - Proposed license plate
- `capacity` (number > 0) - Passenger capacity
- `type` (string) - Vehicle type
- `model` (string) - Vehicle model
- `requestedBy` (string) - Role of the requester

**Validation:**
- Organization must exist
- All required fields must be provided
- Automatically sets status to 'PENDING'

**Response (201):** Created vehicle request object

---

### PATCH /superadmin/:id/approve
**Approve a vehicle request (Global)**

**Authentication:** Required  
**Permissions:** `superadmin` role  
**Access:** Global - can approve any organization's requests

**Request:**
```http
PATCH /api/vehicle-requests/superadmin/req_123/approve
Content-Type: application/json
```

**Request Body:**
```json
{
  "approverRole": "superadmin"
}
```

**Required Fields:**
- `approverRole` (string) - Role of the approver

**Business Logic:**
- Updates status to 'APPROVED'
- Sets approval timestamp
- Records approver information

**Response:** Updated vehicle request object

---

### PATCH /superadmin/:id/reject
**Reject a vehicle request (Global)**

**Authentication:** Required  
**Permissions:** `superadmin` role  
**Access:** Global - can reject any organization's requests

**Request:**
```http
PATCH /api/vehicle-requests/superadmin/req_123/reject
Content-Type: application/json
```

**Request Body:**
```json
{
  "comment": "Insufficient budget allocation for this vehicle type"
}
```

**Required Fields:**
- `comment` (string) - Rejection reason/comment

**Business Logic:**
- Updates status to 'REJECTED'
- Sets approval timestamp
- Records rejection comment

**Response:** Updated vehicle request object

---

### DELETE /superadmin/:id
**Delete a vehicle request (Global)**

**Authentication:** Required  
**Permissions:** `superadmin` role  
**Access:** Global - can delete any organization's requests

**Request:**
```http
DELETE /api/vehicle-requests/superadmin/req_123
```

**Response:** `204 No Content`

---

### GET /superadmin/stats/summary
**Get vehicle request statistics summary**

**Authentication:** Required  
**Permissions:** `superadmin` role  
**Access:** Global statistics across all organizations

**Request:**
```http
GET /api/vehicle-requests/superadmin/stats/summary
```

**Response:**
```json
{
  "totalRequests": 45,
  "requestsByStatus": [
    {
      "status": "PENDING",
      "_count": { "id": 12 }
    },
    {
      "status": "APPROVED", 
      "_count": { "id": 28 }
    },
    {
      "status": "REJECTED",
      "_count": { "id": 5 }
    }
  ],
  "requestsByOrganization": [
    {
      "organization": "Transport Company Inc",
      "count": 20
    },
    {
      "organization": "Logistics Corp",
      "count": 15
    }
  ]
}
```

**Features:**
- Total request count across all organizations
- Status distribution analysis
- Organization-wise request breakdown
- Includes organization names for clarity

---

## Organization-Scoped Endpoints

### GET /
**Get vehicle requests for user's organization**

**Authentication:** Required  
**Permissions:** `vehicleRequest.read`  
**Organization Context:** Uses `activeOrganizationId` from session

**Request:**
```http
GET /api/vehicle-requests?status=PENDING
```

**Query Parameters:**
- `status` (ApprovalStatus, optional) - Filter by status: 'PENDING', 'APPROVED', 'REJECTED'

**Response:**
```json
[
  {
    "id": "req_456",
    "name": "Delivery Van Request",
    "licensePlate": "DEL-VAN-005",
    "capacity": 12,
    "type": "IN_HOUSE", 
    "model": "Transit",
    "vendor": "Local Ford Dealer",
    "dailyRate": 160.00,
    "status": "PENDING",
    "requestedBy": "fleet_supervisor",
    "requestedAt": "2024-09-04T09:15:00.000Z",
    "approvedBy": null,
    "approvedAt": null,
    "comment": null,
    "organizationId": "org_456",
    "categoryId": "cat_delivery",
    "category": {
      "id": "cat_delivery",
      "name": "Delivery Vehicle",
      "description": "Commercial delivery vehicle"
    },
    "organization": {
      "id": "org_456",
      "name": "Transport Company Inc"
    }
  }
]
```

**Features:**
- Returns only requests from user's active organization
- Optional status filtering
- Complete relationship data
- Ordered by request date (newest first)

**Error Responses:**
- `400` - Active organization not found in session
- `403` - Insufficient permissions
- `500` - Internal server error

---

### GET /:id
**Get specific vehicle request in user's organization**

**Authentication:** Required  
**Permissions:** `vehicleRequest.read`  
**Organization Context:** Request must belong to user's active organization

**Request:**
```http
GET /api/vehicle-requests/req_456
```

**Path Parameters:**
- `id` (string, required) - Vehicle request ID

**Response:** Complete vehicle request object with organization and category details

**Error Responses:**
- `400` - Active organization not found in session
- `403` - Insufficient permissions
- `404` - Vehicle request not found in organization
- `500` - Internal server error

---

### POST /
**Submit a new vehicle request in user's organization**

**Authentication:** Required  
**Permissions:** `vehicleRequest.create`  
**Organization Context:** Request automatically assigned to user's active organization

**Request:**
```http
POST /api/vehicle-requests
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "Marketing Van",
  "licensePlate": "MKT-VAN-001",
  "capacity": 8,
  "type": "IN_HOUSE",
  "model": "Sprinter",
  "vendor": "Mercedes Dealership",
  "dailyRate": 200.00,
  "requestedBy": "marketing_manager",
  "categoryId": "cat_marketing"
}
```

**Required Fields:**
- `name` (string) - Vehicle name/identifier
- `licensePlate` (string) - Proposed license plate
- `capacity` (number > 0) - Passenger capacity
- `type` (string) - Vehicle type
- `model` (string) - Vehicle model
- `requestedBy` (string) - Role of the requester

**Optional Fields:**
- `vendor` (string) - Vendor/supplier information
- `dailyRate` (number) - Proposed daily rate
- `categoryId` (string) - Vehicle category ID

**Business Logic:**
- Organization ID automatically set from session
- Status automatically set to 'PENDING'
- Request timestamp automatically set

**Response (201):**
```json
{
  "id": "req_new789",
  "name": "Marketing Van",
  "licensePlate": "MKT-VAN-001",
  "capacity": 8,
  "type": "IN_HOUSE",
  "model": "Sprinter",
  "vendor": "Mercedes Dealership",
  "dailyRate": 200.00,
  "status": "PENDING",
  "requestedBy": "marketing_manager",
  "requestedAt": "2024-09-04T11:30:00.000Z",
  "organizationId": "org_456",
  "categoryId": "cat_marketing",
  "category": {
    "id": "cat_marketing",
    "name": "Marketing Vehicle"
  }
}
```

**Error Responses:**
- `400` - Active organization not found or validation errors
- `403` - Insufficient permissions
- `500` - Internal server error

---

### GET /pending
**Get pending vehicle requests for user's organization**

**Authentication:** Required  
**Permissions:** `vehicleRequest.read`  
**Organization Context:** Returns only pending requests from user's active organization

**Request:**
```http
GET /api/vehicle-requests/pending
```

**Response:**
```json
[
  {
    "id": "req_pending123",
    "name": "Emergency Vehicle",
    "licensePlate": "EMRG-002",
    "status": "PENDING",
    "requestedAt": "2024-09-04T08:45:00.000Z",
    "category": {...},
    "organization": {...}
  }
]
```

**Features:**
- Filters automatically to 'PENDING' status
- Organization-scoped filtering
- Complete relationship data
- Ordered by request date (newest first)

**Error Responses:**
- `400` - Active organization not found in session
- `403` - Insufficient permissions
- `500` - Internal server error

---

### POST /:id/approve
**Approve vehicle request and create actual vehicle**

**Authentication:** Required  
**Permissions:** `vehicleRequest.update` AND `vehicle.create`  
**Organization Context:** Request must belong to user's active organization

**Request:**
```http
POST /api/vehicle-requests/req_456/approve
```

**Path Parameters:**
- `id` (string, required) - Vehicle request ID

**Business Logic:**
1. Validates request exists and is in 'PENDING' status
2. Updates request status to 'APPROVED'
3. Sets approval timestamp and approver
4. **Creates actual vehicle record** from request data
5. Sets new vehicle status to 'AVAILABLE'

**Response:**
```json
{
  "updatedRequest": {
    "id": "req_456",
    "status": "APPROVED",
    "approvedBy": "admin",
    "approvedAt": "2024-09-04T12:00:00.000Z"
  },
  "vehicle": {
    "id": "vehicle_new123",
    "name": "Delivery Van Request",
    "plateNumber": "DEL-VAN-005",
    "capacity": 12,
    "type": "IN_HOUSE",
    "model": "Transit",
    "vendor": "Local Ford Dealer",
    "status": "AVAILABLE",
    "organizationId": "org_456",
    "categoryId": "cat_delivery",
    "category": {
      "id": "cat_delivery",
      "name": "Delivery Vehicle"
    }
  }
}
```

**Key Features:**
- **Automatic Vehicle Creation**: Approved requests become actual vehicles
- Data mapping from request to vehicle record
- Organization consistency maintained
- Vehicle immediately available for assignment

**Error Responses:**
- `400` - Active organization not found
- `403` - Insufficient permissions
- `404` - Request not found or already processed
- `500` - Internal server error

---

### POST /:id/reject
**Reject vehicle request with comment**

**Authentication:** Required  
**Permissions:** `vehicleRequest.update`  
**Organization Context:** Request must belong to user's active organization

**Request:**
```http
POST /api/vehicle-requests/req_456/reject
Content-Type: application/json
```

**Path Parameters:**
- `id` (string, required) - Vehicle request ID

**Request Body:**
```json
{
  "comment": "Budget constraints prevent approval of this vehicle request at this time"
}
```

**Required Fields:**
- `comment` (string) - Rejection reason/comment

**Business Logic:**
- Validates request exists and is in 'PENDING' status
- Updates status to 'REJECTED'
- Records rejection timestamp and approver
- Stores rejection comment for audit trail

**Response:**
```json
{
  "id": "req_456",
  "status": "REJECTED",
  "approvedBy": "admin",
  "approvedAt": "2024-09-04T12:15:00.000Z",
  "comment": "Budget constraints prevent approval of this vehicle request at this time"
}
```

**Error Responses:**
- `400` - Active organization not found
- `403` - Insufficient permissions
- `404` - Request not found or already processed
- `500` - Internal server error

---

## Vehicle Request Model

```typescript
interface VehicleRequest {
  id: string;
  name: string;
  licensePlate: string;
  categoryId?: string;
  dailyRate?: number;
  capacity: number;
  type: string; // Vehicle type classification
  model: string;
  vendor?: string;
  requestedBy: string; // Role of requester
  approvedBy?: string; // Role of approver
  rejectedBy?: string; // Role of rejector (deprecated)
  status: ApprovalStatus; // PENDING, APPROVED, REJECTED
  requestedAt: Date; // Auto-set on creation
  approvedAt?: Date; // Set on approval/rejection
  comment?: string; // Rejection comment or notes
  organizationId: string;
  
  // Relations
  organization: Organization;
  category?: VehicleCategory;
}
```

### Approval Status Values
- `PENDING` - Request awaiting approval/rejection
- `APPROVED` - Request has been approved and vehicle created
- `REJECTED` - Request has been rejected with reason

### Request Lifecycle
1. **Submission**: Fleet manager creates request (status: PENDING)
2. **Review**: Admin reviews request details
3. **Decision**: 
   - **Approve**: Creates actual vehicle, status: APPROVED
   - **Reject**: Records reason, status: REJECTED
4. **Audit**: Complete trail of request, decision, and timeline

---

## Key Features

### **Approval Workflow**
- Structured request-to-vehicle pipeline
- Complete audit trail with timestamps
- Role-based approval tracking
- Comment system for rejection reasons

### **Organization Isolation**
- Multi-tenant request management
- Session-based organization context
- Permission-validated operations
- Cross-organization prevention

### **Data Integrity**
- Request-to-vehicle data mapping
- Status validation and transitions
- Required field enforcement
- Relationship consistency

### **Administrative Oversight**
- Superadmin global access
- Cross-organization statistics
- Comprehensive filtering options
- Bulk administration capabilities
