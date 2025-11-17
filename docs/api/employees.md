# Employees API

## Overview
The Employees API manages workforce information including employee profiles, department assignments, shift scheduling, stop assignments, and employee statistics.

## Base Route
```
/api/employees
```

## Authentication & Permissions
- All endpoints require authentication
- Superadmin routes require `superadmin` role
- Organization-scoped routes require appropriate employee permissions
- Permission validation through Better Auth integration

---

## Superadmin Endpoints

### GET /superadmin
**Get all employees across all organizations**

Returns all employees with full details and relationships.

**Access:** Superadmin only

**Query Parameters:**
- `includeDeleted` (boolean) - Include soft-deleted employees

**Response:**
```json
[
  {
    "id": "clm123emp456",
    "name": "John Doe",
    "email": "john.doe@acme.com",
    "phone": "+1234567890",
    "position": "Senior Developer",
    "employeeNumber": "EMP001",
    "startDate": "2024-01-15T00:00:00.000Z",
    "salary": 75000.00,
    "isActive": true,
    "deleted": false,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z",
    "organizationId": "clm123org",
    "departmentId": "clm123dept",
    "shiftId": "clm123shift",
    "stopId": "clm123stop",
    "organization": {
      "id": "clm123org",
      "name": "Acme Corp"
    },
    "user": {
      "id": "clm123user",
      "name": "John Doe",
      "email": "john.doe@acme.com",
      "role": "EMPLOYEE",
      "createdAt": "2024-01-01T00:00:00.000Z"
    },
    "department": {
      "id": "clm123dept",
      "name": "Engineering",
      "code": "ENG"
    },
    "shift": {
      "id": "clm123shift",
      "name": "Morning Shift",
      "startTime": "08:00:00",
      "endTime": "17:00:00"
    },
    "stop": {
      "id": "clm123stop",
      "name": "Downtown Office",
      "address": "123 Main St",
      "latitude": 40.7128,
      "longitude": -74.0060
    }
  }
]
```

---

### GET /superadmin/:id
**Get specific employee by ID**

**Access:** Superadmin only

**Parameters:**
- `id` (string, required) - Employee ID (CUID)

**Response:**
```json
{
  "id": "clm123emp456",
  "name": "John Doe",
  "email": "john.doe@acme.com",
  "phone": "+1234567890",
  "position": "Senior Developer",
  "employeeNumber": "EMP001",
  "startDate": "2024-01-15T00:00:00.000Z",
  "endDate": null,
  "salary": 75000.00,
  "emergencyContact": {
    "name": "Jane Doe",
    "phone": "+1234567891",
    "relationship": "Spouse"
  },
  "address": {
    "street": "456 Oak St",
    "city": "New York",
    "state": "NY",
    "zipCode": "10001",
    "country": "USA"
  },
  "isActive": true,
  "deleted": false,
  "deletedAt": null,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z",
  "organizationId": "clm123org",
  "departmentId": "clm123dept",
  "shiftId": "clm123shift",
  "stopId": "clm123stop",
  "organization": {
    "id": "clm123org",
    "name": "Acme Corp"
  },
  "user": {
    "id": "clm123user",
    "name": "John Doe",
    "email": "john.doe@acme.com",
    "role": "EMPLOYEE",
    "emailVerified": true,
    "image": "https://example.com/avatar.jpg"
  },
  "department": {
    "id": "clm123dept",
    "name": "Engineering",
    "organization": {
      "id": "clm123org",
      "name": "Acme Corp"
    }
  },
  "shift": {
    "id": "clm123shift",
    "name": "Morning Shift",
    "startTime": "08:00:00",
    "endTime": "17:00:00",
    "organization": {
      "id": "clm123org",
      "name": "Acme Corp"
    }
  },
  "stop": {
    "id": "clm123stop",
    "name": "Downtown Office",
    "address": "123 Main St",
    "latitude": 40.7128,
    "longitude": -74.0060,
    "route": {
      "id": "clm123route",
      "name": "Downtown Route"
    }
  }
}
```

**Error Responses:**
- `400` - Invalid employee ID
- `404` - Employee not found

---

### GET /superadmin/by-organization/:organizationId
**Get all employees for a specific organization**

**Access:** Superadmin only

**Parameters:**
- `organizationId` (string, required) - Organization ID

**Query Parameters:**
- `includeDeleted` (boolean) - Include soft-deleted employees

**Response:** Array of employees for the specified organization, sorted by name

---

### GET /superadmin/by-department/:departmentId
**Get all employees in a specific department**

**Access:** Superadmin only

**Parameters:**
- `departmentId` (string, required) - Department ID

**Query Parameters:**
- `includeDeleted` (boolean) - Include soft-deleted employees

**Response:** Array of employees in the specified department

---

### GET /superadmin/by-shift/:shiftId
**Get all employees assigned to a specific shift**

**Access:** Superadmin only

**Parameters:**
- `shiftId` (string, required) - Shift ID

**Query Parameters:**
- `includeDeleted` (boolean) - Include soft-deleted employees

**Response:** Array of employees assigned to the specified shift

---

### POST /superadmin
**Create a new employee**

**Access:** Superadmin only

**Request Body:**
```json
{
  "name": "Jane Smith",
  "email": "jane.smith@acme.com",
  "phone": "+1234567892",
  "position": "Marketing Manager",
  "employeeNumber": "EMP002",
  "startDate": "2024-02-01T00:00:00.000Z",
  "salary": 65000.00,
  "emergencyContact": {
    "name": "John Smith",
    "phone": "+1234567893",
    "relationship": "Spouse"
  },
  "address": {
    "street": "789 Pine St",
    "city": "New York",
    "state": "NY",
    "zipCode": "10002",
    "country": "USA"
  },
  "isActive": true,
  "organizationId": "clm123org",
  "departmentId": "clm123dept",
  "shiftId": "clm123shift",
  "stopId": "clm123stop"
}
```

**Required Fields:**
- `name` (string, 1-255 characters)
- `email` (string, valid email, unique)
- `organizationId` (string, valid CUID)

**Optional Fields:**
- `phone` (string)
- `position` (string, max 255 characters)
- `employeeNumber` (string, unique within organization)
- `startDate` (ISO datetime)
- `endDate` (ISO datetime)
- `salary` (number, positive)
- `emergencyContact` (object)
- `address` (object)
- `isActive` (boolean, default: true)
- `departmentId` (string, valid CUID)
- `shiftId` (string, valid CUID)
- `stopId` (string, valid CUID)

**Validation:**
- Email must be unique across all organizations
- Employee number must be unique within organization if provided
- Referenced department, shift, and stop must exist and belong to same organization
- Salary must be positive if provided

**Response:** Created employee object (201)

**Error Responses:**
- `400` - Validation errors
- `404` - Referenced entity not found
- `409` - Email or employee number already exists

---

### PUT /superadmin/:id
**Update an employee**

**Access:** Superadmin only

**Parameters:**
- `id` (string, required) - Employee ID

**Request Body:** Same as POST but all fields optional except constraints

**Response:** Updated employee object

**Error Responses:**
- `400` - Invalid employee ID or validation errors
- `404` - Employee not found
- `409` - Email or employee number conflict

---

### DELETE /superadmin/:id
**Soft delete an employee**

**Access:** Superadmin only

**Parameters:**
- `id` (string, required) - Employee ID

**Response:**
```json
{
  "message": "Employee deleted successfully"
}
```

**Note:** This performs a soft delete, setting `deleted: true` and `deletedAt: Date`

---

### PATCH /superadmin/:id/restore
**Restore a soft-deleted employee**

**Access:** Superadmin only

**Parameters:**
- `id` (string, required) - Employee ID

**Response:**
```json
{
  "message": "Employee restored successfully",
  "employee": {
    // restored employee object
  }
}
```

---

### PATCH /superadmin/:id/assign-stop
**Assign or update employee's stop assignment**

**Access:** Superadmin only

**Parameters:**
- `id` (string, required) - Employee ID

**Request Body:**
```json
{
  "stopId": "clm123stop", // or null to unassign
  "routeId": "clm123route" // optional, for validation
}
```

**Response:**
```json
{
  "message": "Stop assigned successfully",
  "employee": {
    // updated employee object
  }
}
```

**Validation:**
- Stop must exist and belong to employee's organization
- If routeId provided, stop must belong to that route

---

### GET /superadmin/stats/summary
**Get employee statistics summary**

**Access:** Superadmin only

**Response:**
```json
{
  "totalEmployees": 450,
  "activeEmployees": 430,
  "inactiveEmployees": 20,
  "totalSalary": 27500000.00,
  "averageSalary": 61111.11,
  "byOrganization": [
    {
      "organizationId": "clm123org1",
      "organizationName": "Acme Corp",
      "employeeCount": 120,
      "activeCount": 115,
      "totalSalary": 7200000.00
    }
  ],
  "byDepartment": [
    {
      "departmentId": "clm123dept1",
      "departmentName": "Engineering",
      "organizationName": "Acme Corp",
      "employeeCount": 45,
      "averageSalary": 78000.00
    }
  ],
  "byShift": [
    {
      "shiftId": "clm123shift1",
      "shiftName": "Morning Shift",
      "employeeCount": 200
    }
  ],
  "newHiresThisMonth": 15,
  "terminationsThisMonth": 3,
  "employeesWithoutStops": 25,
  "employeesWithoutDepartments": 5
}
```

---

## Organization-Scoped Endpoints

### GET /
**Get employees for user's organization**

**Access:** Authenticated users

**Query Parameters:**
- `page` (number) - Page number for pagination
- `limit` (number) - Items per page (max 100)
- `search` (string) - Search by name, email, or employee number
- `departmentId` (string) - Filter by department
- `shiftId` (string) - Filter by shift
- `isActive` (boolean) - Filter by active status
- `hasStop` (boolean) - Filter employees with/without stop assignments

**Response:** Paginated array of employees in user's organization

---

### GET /:id
**Get specific employee in user's organization**

**Access:** Authenticated users

**Parameters:**
- `id` (string, required) - Employee ID

**Response:** Employee object with full details

**Error Responses:**
- `400` - Invalid employee ID
- `404` - Employee not found or not in user's organization

---

### POST /
**Create a new employee in user's organization**

**Access:** Requires `employee:create` permission

**Request Body:**
```json
{
  "name": "Alice Johnson",
  "email": "alice.johnson@acme.com",
  "phone": "+1234567894",
  "position": "Product Manager",
  "employeeNumber": "EMP003",
  "departmentId": "clm123dept",
  "shiftId": "clm123shift"
}
```

**Note:** `organizationId` is automatically set to user's active organization

**Response:** Created employee object (201)

---

### PUT /:id
**Update employee in user's organization**

**Access:** Requires `employee:update` permission

**Parameters:**
- `id` (string, required) - Employee ID

**Request Body:** Employee fields to update

**Response:** Updated employee object

---

### DELETE /:id
**Soft delete employee in user's organization**

**Access:** Requires `employee:delete` permission

**Parameters:**
- `id` (string, required) - Employee ID

**Response:**
```json
{
  "message": "Employee deleted successfully"
}
```

---

### GET /by-department/:departmentId
**Get employees in a specific department**

**Access:** Authenticated users

**Parameters:**
- `departmentId` (string, required) - Department ID

**Query Parameters:**
- `includeInactive` (boolean) - Include inactive employees
- `page` (number) - Page number
- `limit` (number) - Items per page

**Response:** Paginated list of employees in the department

---

### GET /by-shift/:shiftId
**Get employees assigned to a specific shift**

**Access:** Authenticated users

**Parameters:**
- `shiftId` (string, required) - Shift ID

**Query Parameters:**
- `includeInactive` (boolean) - Include inactive employees
- `hasStop` (boolean) - Filter by stop assignment status

**Response:** Array of employees assigned to the shift

---

### GET /shift/:shiftId/unassigned
**Get employees in a shift who don't have stop assignments**

**Access:** Authenticated users

**Parameters:**
- `shiftId` (string, required) - Shift ID

**Response:**
```json
[
  {
    "id": "clm123emp1",
    "name": "Bob Wilson",
    "email": "bob.wilson@acme.com",
    "position": "Developer",
    "department": {
      "name": "Engineering"
    },
    "shift": {
      "name": "Morning Shift"
    },
    "stop": null
  }
]
```

---

### PATCH /:id/assign-stop
**Assign stop to employee**

**Access:** Requires `employee:update` permission

**Parameters:**
- `id` (string, required) - Employee ID

**Request Body:**
```json
{
  "stopId": "clm123stop",
  "routeId": "clm123route" // optional
}
```

**Response:**
```json
{
  "message": "Stop assigned successfully",
  "employee": {
    // updated employee object
  }
}
```

---

### PATCH /:id/restore
**Restore soft-deleted employee**

**Access:** Requires `employee:update` permission

**Parameters:**
- `id` (string, required) - Employee ID

**Response:**
```json
{
  "message": "Employee restored successfully"
}
```

---

### GET /stats/summary
**Get employee statistics for user's organization**

**Access:** Authenticated users

**Response:**
```json
{
  "totalEmployees": 120,
  "activeEmployees": 115,
  "inactiveEmployees": 5,
  "averageSalary": 68500.00,
  "byDepartment": [
    {
      "departmentName": "Engineering",
      "count": 45,
      "averageSalary": 78000.00
    }
  ],
  "byShift": [
    {
      "shiftName": "Morning Shift",
      "count": 60
    }
  ],
  "newHiresThisMonth": 5,
  "employeesWithoutStops": 8,
  "employeesWithoutDepartments": 2
}
```

---

## Employee Model

### Employee Object
```typescript
interface Employee {
  id: string;
  name: string;
  email: string;
  phone?: string;
  position?: string;
  employeeNumber?: string;
  startDate?: Date;
  endDate?: Date;
  salary?: number;
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  address?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  isActive: boolean;
  deleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  organizationId: string;
  departmentId?: string;
  shiftId?: string;
  stopId?: string;
  
  // Relations
  organization: Organization;
  user?: User;
  department?: Department;
  shift?: Shift;
  stop?: Stop;
}
```

### Employee Constraints
- **Name:** 1-255 characters, required
- **Email:** Valid email format, unique across all organizations
- **Employee Number:** Unique within organization (optional)
- **Salary:** Positive number (optional)
- **Phone:** Valid phone format (optional)

---

## Error Handling

### Common Error Responses

**Validation Error (400):**
```json
{
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Valid email address is required"
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
  "message": "Employee not found"
}
```

**Conflict (409):**
```json
{
  "message": "Employee with this email already exists"
}
```

---

## Usage Examples

### Creating an Employee
```bash
curl -X POST /api/employees \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Sarah Connor",
    "email": "sarah.connor@acme.com",
    "position": "Security Specialist",
    "departmentId": "clm123dept456",
    "shiftId": "clm123shift789"
  }'
```

### Searching Employees
```bash
curl -X GET "/api/employees?search=john&departmentId=clm123dept456&page=1&limit=20" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Assigning Stop to Employee
```bash
curl -X PATCH /api/employees/clm123emp456/assign-stop \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "stopId": "clm123stop789",
    "routeId": "clm123route123"
  }'
```

### Getting Employee Statistics
```bash
curl -X GET /api/employees/stats/summary \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Getting Unassigned Employees for Shift
```bash
curl -X GET /api/employees/shift/clm123shift789/unassigned \
  -H "Authorization: Bearer YOUR_TOKEN"
```
