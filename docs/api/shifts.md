# Shifts API

## Overview
The Shifts API manages work shift schedules, including shift times, employee assignments, and shift-related operations for transportation planning.

## Base Route
```
/api/shifts
```

## Authentication & Permissions
- All endpoints require authentication
- Superadmin routes require `superadmin` role
- Organization-scoped routes require appropriate shift permissions

---

## Superadmin Endpoints

### GET /superadmin
**Get all shifts across all organizations**

### GET /superadmin/:id
**Get specific shift by ID**

### GET /superadmin/by-organization/:organizationId
**Get all shifts for a specific organization**

### POST /superadmin
**Create a new shift**

### PUT /superadmin/:id
**Update a shift**

### DELETE /superadmin/:id
**Soft delete a shift**

### GET /superadmin/:id/employees
**Get all employees assigned to a shift**

### GET /superadmin/:id/routes
**Get all routes for a shift**

### GET /superadmin/stats/summary
**Get shift statistics summary**

---

## Organization-Scoped Endpoints

### GET /
**Get shifts for user's organization**

### GET /:id
**Get specific shift in user's organization**

### POST /
**Create a new shift in user's organization**

### PUT /:id
**Update shift in user's organization**

### DELETE /:id
**Soft delete shift in user's organization**

---

## Shift Model

```typescript
interface Shift {
  id: string;
  name: string;
  description?: string;
  startTime: string; // HH:MM:SS format
  endTime: string;   // HH:MM:SS format
  daysOfWeek: string[]; // ["MONDAY", "TUESDAY", ...]
  isActive: boolean;
  deleted: boolean;
  createdAt: Date;
  updatedAt: Date;
  organizationId: string;
  
  // Relations
  organization: Organization;
  employees: Employee[];
  routes: Route[];
}
```

For detailed endpoint documentation, refer to the shifts.ts route file.
