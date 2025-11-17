# Vehicle Availability Route Handlers - Complete Documentation

## Route File Analysis
**File:** `/packages/server/src/routes/vehicle-availability.ts`  
**Total Endpoints:** 6  
**Primary Purpose:** Global vehicle availability tracking and management

---

## Architecture Overview

### Superadmin-Only Design
The Vehicle Availability API is designed exclusively for superadmin users, providing a centralized system for global fleet oversight. There are no organization-scoped endpoints, ensuring that all availability data is managed from a single, high-level administrative context.

### Core Business Logic
- **Availability Tracking**: Records the availability status of vehicles and drivers for specific dates and time windows.
- **Scheduling Coordination**: Prevents conflicts by ensuring that vehicles and drivers are not double-booked.
- **Data Integrity**: Validates that all associated entities (vehicle, driver, organization, etc.) exist and belong to the correct organization.
- **Global Analytics**: Provides summary statistics for fleet-wide availability, helping with resource planning and allocation.

---

## Endpoint Summary Matrix

| Method | Route | Access Level | Purpose | Key Features |
|--------|-------|--------------|---------|--------------|
| GET | `/superadmin` | Superadmin | List all availability records | Comprehensive filtering, relationship data |
| GET | `/superadmin/:id` | Superadmin | Get specific record by ID | Detailed view with all relationships |
| POST | `/superadmin` | Superadmin | Create new availability record | Conflict prevention, entity validation |
| PUT | `/superadmin/:id` | Superadmin | Update availability record | Partial updates supported |
| DELETE | `/superadmin/:id` | Superadmin | Delete availability record | Permanent removal of record |
| GET | `/superadmin/stats/summary` | Superadmin | Get availability statistics | Global analytics, org breakdown |

---

## Authentication & Permission Patterns

### Superadmin Authentication
All endpoints use the `requireAuth` and `requireRole(["superadmin"])` middleware to ensure that only authenticated superadmins can access the API.

```typescript
// Global access verification for all routes
router.get('/superadmin', requireAuth, requireRole(["superadmin"]), ...);
router.post('/superadmin', requireAuth, requireRole(["superadmin"]), ...);
// etc.
```

---

## Data Schemas & Validation

### Vehicle Availability Model (Prisma)
```prisma
model VehicleAvailability {
  id             String    @id @default(cuid())
  date           DateTime
  startTime      DateTime
  endTime        DateTime
  available      Boolean   @default(true)
  
  vehicleId      String
  driverId       String
  routeId        String?
  shiftId        String?
  organizationId String

  vehicle        Vehicle      @relation(fields: [vehicleId], references: [id])
  driver         Driver       @relation(fields: [driverId], references: [id])
  route          Route?       @relation(fields: [routeId], references: [id])
  shift          Shift?       @relation(fields: [shiftId], references: [id])
  organization   Organization @relation(fields: [organizationId], references: [id])

  @@unique([vehicleId, shiftId, date])
  @@map("vehicle_availability")
}
```

### Input Validation (Implicit)
The API performs manual validation within each route handler rather than using Zod schemas.

**Key Validation Checks:**
- **Presence of Required Fields**: Ensures `date`, `startTime`, `endTime`, `vehicleId`, `driverId`, and `organizationId` are provided for creation.
- **Entity Existence**: Verifies that the specified `organization`, `vehicle`, `driver`, and `shift` (if applicable) exist in the database.
- **Organizational Consistency**: Confirms that the `vehicle`, `driver`, and `shift` all belong to the specified `organizationId`.
- **Conflict Prevention**: Checks for existing records for the same `vehicleId`, `shiftId`, and `date` to prevent duplicates.

---

## Key Business Rules

### **1. Entity & Relationship Validation**
```typescript
// Ensures all related entities exist and are consistent
const organization = await prisma.organization.findUnique({ where: { id: organizationId } });
if (!organization) return res.status(404).json({ message: 'Organization not found' });

const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
if (!vehicle || vehicle.organizationId !== organizationId) {
  return res.status(400).json({ message: 'Vehicle not found or does not belong to the organization' });
}

const driver = await prisma.driver.findUnique({ where: { id: driverId } });
if (!driver || driver.organizationId !== organizationId) {
  return res.status(400).json({ message: 'Driver not found or does not belong to the organization' });
}
```

### **2. Duplicate Record Prevention**
```typescript
// Enforces unique constraint for vehicle, shift, and date
if (shiftId) {
    const existingRecord = await prisma.vehicleAvailability.findFirst({
        where: {
            vehicleId,
            shiftId,
            date: new Date(date),
        },
    });
    if (existingRecord) {
        return res.status(409).json({ message: 'Vehicle availability for this vehicle, shift, and date already exists.' });
    }
}
```

---

## Error Handling Patterns

### Standard Error Responses
```typescript
// 400 - Bad Request
{
  "message": "Missing required fields"
  // or
  "message": "Vehicle not found or does not belong to the organization"
}

// 404 - Not Found
{
  "message": "Vehicle availability record not found"
}

// 409 - Conflict
{
  "message": "Vehicle availability for this vehicle, shift, and date already exists."
}

// 500 - Internal Server Error
{
  "message": "Internal Server Error"
}
```

---

## Database Integration

### Prisma Query Patterns
- **Filtered Listing**: The `GET /superadmin` endpoint uses a dynamic `where` clause to support multiple query parameters for flexible filtering.
- **Relationship Loading**: All queries use `include` to fetch related data (organization, vehicle, driver, etc.) for comprehensive responses.
- **Statistical Aggregation**: The `GET /superadmin/stats/summary` endpoint uses `count` and `groupBy` to generate analytics on availability records.

```typescript
// Example of statistical query
const availabilityByOrg = await prisma.vehicleAvailability.groupBy({
    by: ['organizationId'],
    _count: {
        id: true,
    },
    orderBy: {
        _count: {
            id: 'desc',
        },
    },
});
```

---

## Advanced Features

### **1. Global Statistics**
The statistics endpoint provides a high-level summary of fleet availability across all organizations, including:
- Total number of availability records.
- Counts of available vs. unavailable records.
- A breakdown of record counts by organization.

### **2. Comprehensive Filtering**
The primary listing endpoint allows superadmins to drill down into the data with a variety of filters, enabling them to analyze availability by organization, vehicle, driver, route, shift, or date range. This flexibility is crucial for effective global fleet management.

---

## Integration Points

- **Vehicle Management**: Availability records are directly tied to specific vehicles.
- **Driver Management**: Availability is linked to drivers, ensuring personnel are also scheduled appropriately.
- **Route & Shift Planning**: Associates availability with operational schedules (routes and shifts).
- **Organization Management**: All data is scoped by organization, even under a global superadmin view.

This documentation provides a complete overview of the Vehicle Availability API, highlighting its superadmin-focused design and its role in global fleet coordination and analytics.
