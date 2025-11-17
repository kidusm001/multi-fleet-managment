# Organization-Scoped Route Handler Patterns

## Overview

This document focuses specifically on the organization-scoped route handlers in the multi-fleet management system. These endpoints provide secure, multi-tenant access where users can only access data belonging to their active organization.

## Core Organization-Scoped Architecture

### Session-Based Organization Context
All organization-scoped endpoints use the `activeOrganizationId` from the user's session:

```typescript
const activeOrgId = req.session?.session?.activeOrganizationId;
if (!activeOrgId) {
    return res.status(400).json({ message: 'Active organization not found' });
}
```

### Permission-Based Access Control
Organization-scoped routes use Better Auth's granular permission system:

```typescript
const hasPermission = await auth.api.hasPermission({
    headers: await fromNodeHeaders(req.headers),
    body: { permissions: { [resource]: [action] } }
});
if (!hasPermission.success) {
    return res.status(403).json({ message: 'Unauthorized' });
}
```

### Data Isolation
All database queries include organization filtering:

```typescript
const items = await prisma.model.findMany({
    where: {
        organizationId: activeOrgId,
        // other conditions
    }
});
```

---

## Organization-Scoped Route Categories

### 1. Vehicle Management Routes (`/api/vehicles`)

**Core Endpoints:**
- `GET /` - List organization's vehicles
- `GET /:id` - Get specific vehicle in organization
- `POST /` - Create vehicle in organization
- `PUT /:id` - Update organization's vehicle
- `DELETE /:id` - Soft delete organization's vehicle

**Special Vehicle Endpoints:**
- `GET /maintenance` - Vehicles in maintenance status
- `GET /available` - Available vehicles for assignment
- `GET /vehicle-availability/shift/:shiftId/available` - Shift-specific availability
- `PATCH /:id/restore` - Restore soft-deleted vehicle
- `POST /:id/check-availability` - Check vehicle availability

**Key Organization-Scoped Features:**
- Plate number uniqueness within organization
- Category and driver validation within organization
- Active route conflict checking
- Maintenance timeline tracking
- Availability management per organization

### 2. Department Management Routes (`/api/departments`)

**Core Endpoints:**
- `GET /` - List organization's departments
- `GET /:id` - Get specific department with employees
- `POST /` - Create department in organization
- `PUT /:id` - Update organization's department
- `DELETE /:id` - Delete organization's department

**Key Organization-Scoped Features:**
- Department name uniqueness within organization
- Employee relationship management
- Employee count aggregation
- Shift and stop assignment tracking

### 3. Employee Management Routes (`/api/employees`)

**Core Endpoints:**
- `GET /` - List organization's employees
- `GET /:id` - Get specific employee details
- `POST /` - Create employee in organization
- `PUT /:id` - Update employee information
- `DELETE /:id` - Soft delete employee

**Special Employee Endpoints:**
- `GET /by-department/:departmentId` - Employees by department
- `GET /without-shifts` - Unassigned employees
- `POST /:id/assign-shift` - Assign employee to shift
- `POST /:id/assign-stop` - Assign employee to stop
- `GET /stats` - Employee statistics

**Key Organization-Scoped Features:**
- Department assignment validation
- User account linkage within organization
- Shift and stop assignment management
- Employee statistics and reporting

### 4. Route Management Routes (`/api/routes`)

**Core Endpoints:**
- `GET /` - List organization's routes
- `GET /:id` - Get specific route details
- `POST /` - Create route in organization
- `PUT /:id` - Update route information
- `DELETE /:id` - Soft delete route

**Special Route Endpoints:**
- `GET /active` - Active routes only
- `GET /by-shift/:shiftId` - Routes for specific shift
- `POST /:id/assign-vehicle` - Assign vehicle to route
- `POST /:id/assign-stops` - Assign stops to route
- `PATCH /:id/restore` - Restore deleted route

**Key Organization-Scoped Features:**
- Vehicle assignment validation within organization
- Shift schedule coordination
- Stop sequence management
- Route optimization integration

### 5. Stop Management Routes (`/api/stops`)

**Core Endpoints:**
- `GET /` - List organization's stops
- `GET /:id` - Get specific stop details
- `POST /` - Create stop in organization
- `PUT /:id` - Update stop information
- `DELETE /:id` - Delete stop

**Special Stop Endpoints:**
- `GET /unassigned` - Stops without employee assignments
- `GET /by-route/:routeId` - Stops for specific route
- `POST /:id/assign-employees` - Assign employees to stop
- `GET /nearby` - Geographical proximity search

**Key Organization-Scoped Features:**
- Employee assignment tracking
- Route integration
- Geographical coordinate management
- Sequence ordering within routes

---

## Common Organization-Scoped Patterns

### 1. Data Validation Pattern
```typescript
// Validate referenced entities belong to same organization
if (data.categoryId) {
    const category = await prisma.category.findFirst({
        where: { id: data.categoryId, organizationId: activeOrgId }
    });
    if (!category) {
        return res.status(404).json({ 
            message: 'Category not found in this organization' 
        });
    }
}
```

### 2. Uniqueness Within Organization
```typescript
// Check uniqueness within organization scope
const existing = await prisma.model.findFirst({
    where: {
        uniqueField: data.uniqueField,
        organizationId: activeOrgId,
        id: { not: id } // For updates
    }
});
if (existing) {
    return res.status(409).json({ 
        message: 'Resource with this identifier already exists in organization' 
    });
}
```

### 3. Soft Delete with Organization Scope
```typescript
// Organization-scoped soft delete
await prisma.model.update({
    where: { id },
    data: {
        deleted: true,
        deletedAt: new Date(),
        isActive: false
    }
});
```

### 4. Relationship Filtering
```typescript
// Include only organization-scoped relationships
const item = await prisma.model.findFirst({
    where: { id, organizationId: activeOrgId },
    include: {
        relatedItems: {
            where: { deleted: false }
        },
        _count: {
            select: {
                relatedItems: {
                    where: { deleted: false }
                }
            }
        }
    }
});
```

---

## Security Considerations

### 1. Organization Isolation
- All database queries MUST include `organizationId` filtering
- Cross-organization data access is prevented at the database level
- Session validation ensures valid organization context

### 2. Permission Granularity
- Resource-specific permissions (`vehicle.read`, `department.create`)
- Action-based access control (`read`, `create`, `update`, `delete`)
- Better Auth integration for permission validation

### 3. Data Integrity
- Foreign key relationships validated within organization scope
- Referential integrity maintained across organization boundaries
- Cascade operations respect organization boundaries

---

## Error Handling Patterns

### Common Error Responses

**400 - Bad Request:**
- Missing active organization in session
- Invalid input validation
- Business rule violations (e.g., vehicle has active routes)

**403 - Forbidden:**
- Insufficient permissions for the operation
- Permission validation failure

**404 - Not Found:**
- Resource doesn't exist in user's organization
- Referenced entity not found in organization

**409 - Conflict:**
- Uniqueness constraint violation within organization
- Resource already exists with same identifier

**500 - Internal Server Error:**
- Database connection issues
- Unexpected server errors

---

## Performance Considerations

### 1. Database Indexing
- Composite indexes on `(organizationId, otherFields)`
- Efficient filtering for organization-scoped queries
- Optimized joins for relationship queries

### 2. Query Optimization
- Selective field inclusion in responses
- Pagination for large datasets
- Efficient counting queries with `_count`

### 3. Caching Strategies
- Organization-scoped cache keys
- Permission result caching
- Session state caching

---

## Implementation Guidelines

### 1. New Organization-Scoped Endpoints
1. Always validate `activeOrganizationId` from session
2. Check appropriate permissions using Better Auth
3. Include `organizationId` in all database queries
4. Validate related entities belong to same organization
5. Use consistent error response patterns

### 2. Testing Organization Scope
1. Test with multiple organizations
2. Verify data isolation between organizations
3. Test permission boundary conditions
4. Validate cross-organization access prevention

### 3. Monitoring and Logging
1. Log organization context in operations
2. Monitor cross-organization access attempts
3. Track permission usage patterns
4. Alert on organization isolation violations

This comprehensive guide provides the foundation for understanding and implementing organization-scoped route handlers in the multi-fleet management system.
