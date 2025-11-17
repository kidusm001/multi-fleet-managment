# Drivers API

## Overview
The Drivers API manages driver information, vehicle assignments, licenses, and driver-related operations for fleet management.

## Base Route
```
/api/drivers
```

## Authentication & Permissions
- All endpoints require authentication
- Superadmin routes require `superadmin` role
- Organization-scoped routes require appropriate driver permissions

---

## Superadmin Endpoints

### GET /superadmin
**Get all drivers across all organizations**

### GET /superadmin/:id
**Get specific driver by ID**

### GET /superadmin/by-organization/:organizationId
**Get all drivers for a specific organization**

### POST /superadmin
**Create a new driver**

### PUT /superadmin/:id
**Update a driver**

### DELETE /superadmin/:id
**Soft delete a driver**

### PATCH /superadmin/:id/assign-vehicle
**Assign or unassign vehicle to driver**

### GET /superadmin/stats/summary
**Get driver statistics summary**

---

## Organization-Scoped Endpoints

### GET /
**Get drivers for user's organization**

### GET /:id
**Get specific driver in user's organization**

### POST /
**Create a new driver in user's organization**

### PUT /:id
**Update driver in user's organization**

### DELETE /:id
**Soft delete driver in user's organization**

### PATCH /:id/assign-vehicle
**Assign vehicle to driver**

---

## Driver Model

```typescript
interface Driver {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  licenseNumber: string;
  licenseExpiry?: Date;
  experience?: number; // years
  rating?: number; // 1-5 scale
  isActive: boolean;
  deleted: boolean;
  createdAt: Date;
  updatedAt: Date;
  organizationId: string;
  
  // Relations
  organization: Organization;
  vehicles: Vehicle[];
}
```

For detailed endpoint documentation, refer to the drivers.ts route file.
