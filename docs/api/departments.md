# Departments API

## Overview
The Departments API manages organizational departments, including employee assignments, department hierarchies, and departmental statistics.

## Base Route
```
/api/departments
```

## Authentication & Permissions
- All endpoints require authentication
- Superadmin routes require `superadmin` role
- Organization-scoped routes require appropriate department permissions
- Permission validation through Better Auth integration

---

## Superadmin Endpoints

### GET /superadmin
**Get all departments across all organizations**

Returns all departments with employee counts and organization details.

**Access:** Superadmin only

**Response:**
```json
[
  {
    "id": "clm123dept456",
    "name": "Engineering",
    "description": "Software development department",
    "code": "ENG",
    "isActive": true,
    "deleted": false,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z",
    "organizationId": "clm123org",
    "organization": {
      "id": "clm123org",
      "name": "Acme Corp",
      "domain": "acme.com"
    },
    "employees": [
      {
        "id": "clm123emp1",
        "name": "John Doe",
        "email": "john@acme.com",
        "position": "Senior Developer"
      }
    ],
    "_count": {
      "employees": 15
    }
  }
]
```

---

### GET /superadmin/:id
**Get specific department by ID**

**Access:** Superadmin only

**Parameters:**
- `id` (string, required) - Department ID (CUID)

**Response:**
```json
{
  "id": "clm123dept456",
  "name": "Engineering",
  "description": "Software development department",
  "code": "ENG",
  "isActive": true,
  "deleted": false,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z",
  "organizationId": "clm123org",
  "organization": {
    "id": "clm123org",
    "name": "Acme Corp"
  },
  "employees": [
    {
      "id": "clm123emp1",
      "name": "John Doe",
      "email": "john@acme.com",
      "position": "Senior Developer",
      "deleted": false,
      "user": {
        "id": "clm123user1",
        "name": "John Doe",
        "email": "john@acme.com"
      },
      "shift": {
        "id": "clm123shift1",
        "name": "Morning Shift",
        "startTime": "08:00:00",
        "endTime": "17:00:00"
      },
      "stop": {
        "id": "clm123stop1",
        "name": "Downtown Office",
        "address": "123 Main St"
      }
    }
  ],
  "_count": {
    "employees": 15
  }
}
```

**Error Responses:**
- `400` - Invalid department ID
- `404` - Department not found

---

### GET /superadmin/by-organization/:organizationId
**Get all departments for a specific organization**

**Access:** Superadmin only

**Parameters:**
- `organizationId` (string, required) - Organization ID

**Response:** Array of departments for the specified organization, sorted by name

---

### POST /superadmin
**Create a new department**

**Access:** Superadmin only

**Request Body:**
```json
{
  "name": "Marketing",
  "description": "Marketing and sales department",
  "code": "MKT",
  "isActive": true,
  "organizationId": "clm123org"
}
```

**Required Fields:**
- `name` (string, 1-255 characters)
- `organizationId` (string, valid CUID)

**Optional Fields:**
- `description` (string, max 1000 characters)
- `code` (string, max 10 characters, unique within organization)
- `isActive` (boolean, default: true)

**Validation:**
- Department name must be unique within organization
- Department code must be unique within organization if provided
- Organization must exist

**Response:** Created department object (201)

**Error Responses:**
- `400` - Validation errors
- `404` - Organization not found
- `409` - Department name or code already exists in organization

---

### PUT /superadmin/:id
**Update a department**

**Access:** Superadmin only

**Parameters:**
- `id` (string, required) - Department ID

**Request Body:** Same as POST but all fields optional except constraints

**Response:** Updated department object

**Error Responses:**
- `400` - Invalid department ID or validation errors
- `404` - Department not found
- `409` - Name or code conflict

---

### DELETE /superadmin/:id
**Soft delete a department**

**Access:** Superadmin only

**Parameters:**
- `id` (string, required) - Department ID

**Query Parameters:**
- `force` (boolean) - Force delete even if department has employees

**Validation:**
- Cannot delete department with active employees unless `force=true`
- Force delete will unassign all employees from the department

**Response:**
```json
{
  "message": "Department deleted successfully"
}
```

**Error Responses:**
- `400` - Invalid department ID or department has employees (without force)
- `404` - Department not found

---

### GET /superadmin/:id/employees
**Get all employees in a specific department**

**Access:** Superadmin only

**Parameters:**
- `id` (string, required) - Department ID

**Query Parameters:**
- `includeDeleted` (boolean) - Include soft-deleted employees
- `page` (number) - Page number for pagination
- `limit` (number) - Items per page

**Response:**
```json
{
  "employees": [
    {
      "id": "clm123emp1",
      "name": "John Doe",
      "email": "john@acme.com",
      "position": "Senior Developer",
      "deleted": false,
      "user": {
        "id": "clm123user1",
        "name": "John Doe",
        "email": "john@acme.com"
      },
      "shift": {
        "id": "clm123shift1",
        "name": "Morning Shift"
      },
      "stop": {
        "id": "clm123stop1",
        "name": "Downtown Office"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 15,
    "totalPages": 2
  }
}
```

---

### GET /superadmin/stats/summary
**Get department statistics summary**

**Access:** Superadmin only

**Response:**
```json
{
  "totalDepartments": 25,
  "activeDepartments": 22,
  "inactiveDepartments": 3,
  "totalEmployees": 450,
  "avgEmployeesPerDepartment": 18,
  "byOrganization": [
    {
      "organizationId": "clm123org1",
      "organizationName": "Acme Corp",
      "departmentCount": 8,
      "employeeCount": 120
    }
  ],
  "topDepartmentsBySize": [
    {
      "departmentId": "clm123dept1",
      "departmentName": "Engineering",
      "organizationName": "Acme Corp",
      "employeeCount": 45
    }
  ],
  "departmentsWithoutEmployees": [
    {
      "departmentId": "clm123dept2",
      "departmentName": "Research",
      "organizationName": "Acme Corp"
    }
  ]
}
```

---

## Organization-Scoped Endpoints

### GET /
**Get departments for user's organization**

**Authentication:** Required  
**Permissions:** `department.read`  
**Organization Context:** Uses `activeOrganizationId` from session

**Request:**
```http
GET /api/departments
```

**Response:**
```json
[
  {
    "id": "dept_123",
    "name": "Transportation",
    "description": "Vehicle and route management",
    "organizationId": "org_456",
    "createdAt": "2024-08-15T10:30:00.000Z",
    "updatedAt": "2024-08-15T10:30:00.000Z"
  },
  {
    "id": "dept_789",
    "name": "Operations",
    "description": "Day-to-day operational management",
    "organizationId": "org_456",
    "createdAt": "2024-08-16T09:15:00.000Z",
    "updatedAt": "2024-08-16T09:15:00.000Z"
  }
]
```

**Features:**
- Returns only departments from user's active organization
- Simple department list without employee details for performance
- Ordered by creation date

**Error Responses:**
- `400` - Active organization not found in session
- `403` - Insufficient permissions
- `500` - Internal server error

---

### GET /:id
**Get specific department by ID within user's organization**

**Authentication:** Required  
**Permissions:** `department.read`  
**Organization Context:** Department must belong to user's active organization

**Request:**
```http
GET /api/departments/dept_123
```

**Path Parameters:**
- `id` (string, required) - Department ID

**Response:**
```json
{
  "id": "dept_123",
  "name": "Transportation",
  "description": "Vehicle and route management",
  "organizationId": "org_456",
  "createdAt": "2024-08-15T10:30:00.000Z",
  "updatedAt": "2024-08-15T10:30:00.000Z",
  "employees": [
    {
      "id": "emp_456",
      "userId": "user_789",
      "user": {
        "id": "user_789",
        "name": "John Doe",
        "email": "john.doe@company.com"
      },
      "shift": {
        "id": "shift_123",
        "name": "Morning Shift"
      },
      "stop": {
        "id": "stop_456",
        "name": "Downtown Station"
      }
    }
  ],
  "_count": {
    "employees": 5
  }
}
```

**Features:**
- Includes complete employee details with user information
- Shows shift and stop assignments for employees
- Provides employee count
- Excludes deleted employees
- Organization-scoped access control

**Error Responses:**
- `400` - Active organization not found in session
- `403` - Insufficient permissions
- `404` - Department not found in organization
- `500` - Internal server error

---

### POST /
**Create a new department in user's organization**

**Authentication:** Required  
**Permissions:** `department.create`  
**Organization Context:** Department automatically assigned to user's active organization

**Request:**
```http
POST /api/departments
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "Human Resources",
  "description": "Employee management and support"
}
```

**Required Fields:**
- `name` (string) - Department name (trimmed, unique within organization)

**Optional Fields:**
- `description` (string) - Department description

**Validation:**
- Department name must be unique within organization
- Name is automatically trimmed of whitespace
- Organization ID automatically set from session

**Response (201):**
```json
{
  "id": "dept_new123",
  "name": "Human Resources",
  "description": "Employee management and support",
  "organizationId": "org_456",
  "createdAt": "2024-09-04T11:30:00.000Z",
  "updatedAt": "2024-09-04T11:30:00.000Z",
  "organization": {
    "id": "org_456",
    "name": "Company Name"
  }
}
```

**Error Responses:**
- `400` - Active organization not found in session
- `403` - Insufficient permissions
- `409` - Department name already exists in organization
- `500` - Internal server error

---

### PUT /:id
**Update department in user's organization**

**Access:** Requires `department:update` permission

**Parameters:**
- `id` (string, required) - Department ID

**Request Body:** Department fields to update

**Response:** Updated department object

---

### DELETE /:id
**Soft delete department in user's organization**

**Access:** Requires `department:delete` permission

**Parameters:**
- `id` (string, required) - Department ID

**Query Parameters:**
- `force` (boolean) - Force delete even if department has employees

**Response:**
```json
{
  "message": "Department deleted successfully"
}
```

---

### GET /:id/employees
**Get employees in a specific department**

**Access:** Authenticated users

**Parameters:**
- `id` (string, required) - Department ID

**Query Parameters:**
- `page` (number) - Page number
- `limit` (number) - Items per page
- `search` (string) - Search by employee name or email

**Response:** Paginated list of employees in the department

---

### POST /:id/employees
**Assign employees to a department**

**Access:** Requires `department:update` permission

**Parameters:**
- `id` (string, required) - Department ID

**Request Body:**
```json
{
  "employeeIds": ["clm123emp1", "clm123emp2"]
}
```

**Response:**
```json
{
  "message": "Employees assigned to department successfully",
  "assignedCount": 2
}
```

---

### DELETE /:id/employees/:employeeId
**Remove employee from department**

**Access:** Requires `department:update` permission

**Parameters:**
- `id` (string, required) - Department ID
- `employeeId` (string, required) - Employee ID

**Response:**
```json
{
  "message": "Employee removed from department successfully"
}
```

---

## Department Model

### Department Object
```typescript
interface Department {
  id: string;
  name: string;
  description?: string;
  code?: string;
  isActive: boolean;
  deleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  organizationId: string;
  
  // Relations
  organization: Organization;
  employees: Employee[];
  _count?: {
    employees: number;
  };
}
```

### Department Constraints
- **Name:** 1-255 characters, unique within organization
- **Code:** Max 10 characters, unique within organization (optional)
- **Description:** Max 1000 characters (optional)

---

## Error Handling

### Common Error Responses

**Validation Error (400):**
```json
{
  "message": "Validation failed",
  "errors": [
    {
      "field": "name",
      "message": "Department name is required"
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
  "message": "Department not found"
}
```

**Conflict (409):**
```json
{
  "message": "Department with this name already exists in organization"
}
```

**Business Logic Error (400):**
```json
{
  "message": "Cannot delete department with active employees. Use force=true to override"
}
```

---

## Usage Examples

### Creating a Department
```bash
curl -X POST /api/departments \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Human Resources",
    "description": "HR and people operations",
    "code": "HR",
    "isActive": true
  }'
```

### Getting Department Statistics
```bash
curl -X GET /api/departments/superadmin/stats/summary \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Assigning Employees to Department
```bash
curl -X POST /api/departments/clm123dept456/employees \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "employeeIds": ["clm123emp1", "clm123emp2", "clm123emp3"]
  }'
```

### Searching Departments
```bash
curl -X GET "/api/departments?search=engineering&includeInactive=false" \
  -H "Authorization: Bearer YOUR_TOKEN"
```
