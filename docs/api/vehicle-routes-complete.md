# Vehicle Route Handlers - Complete Documentation

## Overview

This document provides a comprehensive overview of all vehicle route handlers in the multi-fleet management system, including detailed implementations, request/response patterns, and business logic.

## Route Handler Summary

### **Superadmin Endpoints (Global Access)**

| Method | Endpoint | Description | Key Features |
|--------|----------|-------------|--------------|
| `GET` | `/superadmin/` | Get all vehicles across organizations | Global vehicle overview, complete relationships |
| `GET` | `/superadmin/with-deleted` | Get all vehicles including deleted | Admin audit trail, soft delete visibility |
| `GET` | `/superadmin/:id` | Get specific vehicle by ID | Cross-organization vehicle access |
| `GET` | `/superadmin/by-organization/:organizationId` | Get vehicles for specific organization | Organization filtering for admins |
| `POST` | `/superadmin` | Create vehicle for any organization | Global vehicle creation with validation |
| `PUT` | `/superadmin/:id` | Update any vehicle | Cross-organization vehicle updates |
| `DELETE` | `/superadmin/:id` | Soft delete any vehicle | Global deletion with route conflict checking |
| `PATCH` | `/superadmin/:id/restore` | Restore deleted vehicle | Global vehicle restoration |
| `PATCH` | `/superadmin/:id/assign-driver` | Assign/unassign driver globally | Cross-organization driver assignment |
| `PATCH` | `/superadmin/:id/status` | Update vehicle status globally | Global status management |
| `GET` | `/superadmin/maintenance` | Global maintenance schedule | Cross-organization maintenance overview |
| `GET` | `/superadmin/available` | All available vehicles | Global availability insights |
| `GET` | `/superadmin/vehicle-availability/shift/:shiftId/available` | Global shift availability | Cross-organization shift planning |

### **Organization-Scoped Endpoints (Multi-Tenant)**

| Method | Endpoint | Description | Key Features |
|--------|----------|-------------|--------------|
| `GET` | `/` | Get organization's vehicles | Session-based org filtering, performance optimized |
| `GET` | `/:id` | Get specific vehicle in organization | Complete relationship data, org validation |
| `POST` | `/` | Create vehicle in organization | Auto org assignment, reference validation |
| `PUT` | `/:id` | Update organization's vehicle | Org-scoped updates, conflict prevention |
| `DELETE` | `/:id` | Soft delete organization's vehicle | Route conflict checking, safety validation |
| `PATCH` | `/:id/restore` | Restore organization's vehicle | Org-scoped restoration |
| `PATCH` | `/:id/assign-driver` | Assign driver within organization | Org-scoped driver validation |
| `PATCH` | `/:id/status` | Update vehicle status | Automatic driver unassignment logic |
| `PATCH` | `/:id/maintenance-status` | Smart maintenance management | Auto scheduling, driver management |
| `GET` | `/maintenance` | Organization's maintenance schedule | Maintenance timeline calculation |
| `GET` | `/available` | Available vehicles in organization | Route conflict filtering |
| `GET` | `/vehicle-availability/shift/:shiftId/available` | Shift-specific availability | Organization-scoped scheduling |
| `GET` | `/shuttle-availability/shift/:shiftId/available` | Shuttle service availability | Specialized shuttle routing |
| `POST` | `/:id/check-availability` | Complex availability validation | VehicleAvailabilityService integration |

---

## **Implementation Patterns Documented**

### **1. Authentication & Authorization**
- **Better Auth Integration**: `auth.api.hasPermission()` for granular permissions
- **Role-Based Access**: Superadmin vs organization-scoped permissions
- **Session Management**: `activeOrganizationId` for multi-tenant context

### **2. Data Validation & Schemas**
- **Zod Schema Validation**: `CreateVehicleSchema`, `UpdateVehicleSchema`, `AssignDriverSchema`
- **Business Rule Validation**: Active route checking, driver status validation
- **Organization Scope Validation**: Cross-reference validation within organizations

### **3. Database Operations**
- **Soft Delete Pattern**: `deleted: true`, `deletedAt: timestamp`, `isActive: false`
- **Relationship Management**: Category, driver, route, organization associations
- **Conflict Prevention**: Route assignment validation, uniqueness checking

### **4. Business Logic Features**
- **Automatic Driver Management**: Status-based driver unassignment
- **Maintenance Scheduling**: 30-day auto-scheduling, timeline calculation
- **Availability Services**: Complex availability checking with VehicleAvailabilityService
- **Route Conflict Prevention**: Active route validation before operations

### **5. Error Handling Patterns**
- **400 Bad Request**: Validation errors, business rule violations
- **403 Forbidden**: Permission failures, unauthorized access
- **404 Not Found**: Resource not found, organization scope violations
- **409 Conflict**: Uniqueness violations, resource conflicts
- **500 Internal Server Error**: Database and system errors

---

## **Key Documentation Features**

### **Request/Response Examples**
- Complete JSON request bodies with all fields
- Detailed response structures with relationships
- Error response patterns with specific messages

### **Business Logic Documentation**
- Automatic driver unassignment rules
- Maintenance scheduling algorithms
- Route conflict validation logic
- Organization scope enforcement

### **Validation Rules**
- Required vs optional field specifications
- Data type and format requirements
- Business rule constraints
- Cross-reference validation requirements

### **Security Considerations**
- Organization data isolation patterns
- Permission-based access control
- Session-based organization context
- Cross-organization access prevention

---

## **Advanced Features Documented**

### **1. Vehicle Availability Service**
```typescript
const availabilityService = new VehicleAvailabilityService();
const result = await availabilityService.validateRouteTimeWindow(
    vehicleId,
    startTime,
    endTime
);
```

### **2. Maintenance Status Management**
```typescript
// Automatic maintenance scheduling
{
    lastMaintenance: new Date(),
    nextMaintenance: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    driverId: null // Auto-unassign for safety
}
```

### **3. Route Conflict Prevention**
```typescript
const activeRoutesCount = await prisma.route.count({
    where: {
        vehicleId: id,
        status: 'ACTIVE'
    }
});
```

### **4. Organization Scope Enforcement**
```typescript
const vehicle = await prisma.vehicle.findFirst({
    where: { 
        id, 
        organizationId: activeOrgId 
    }
});
```

---

## **Performance Optimizations Documented**

### **1. Selective Relationship Loading**
- Basic endpoints load minimal relationships
- Detail endpoints load complete relationship trees
- Count aggregations for performance metrics

### **2. Query Optimization**
- Organization-scoped filtering at database level
- Composite indexes on `(organizationId, status, deleted)`
- Efficient availability checking algorithms

### **3. Validation Efficiency**
- Early validation failures for quick feedback
- Batch validation for multiple constraints
- Cached permission results where applicable

---

## **Integration Points**

### **1. External Services**
- **VehicleAvailabilityService**: Complex scheduling algorithms
- **Better Auth**: Permission and session management
- **Prisma ORM**: Type-safe database operations

### **2. Internal Dependencies**
- **Vehicle Categories**: Organization-scoped categorization
- **Drivers**: Organization-scoped driver management
- **Routes**: Vehicle assignment and conflict management
- **Organizations**: Multi-tenant data isolation

### **3. Middleware Integration**
- **Authentication**: `requireAuth` middleware
- **Authorization**: `requireRole` middleware
- **Validation**: `validateSchema` and `validateMultiple`
- **Error Handling**: Consistent error response patterns

This comprehensive documentation provides complete coverage of all vehicle route handlers with detailed implementation insights, business logic explanations, and practical usage examples for both superadmin and organization-scoped operations.
