# Vehicle Categories Route Handlers - Complete Documentation

## Route File Analysis
**File:** `/packages/server/src/routes/vehicle-categories.ts`  
**Total Endpoints:** 14 (9 Superadmin + 5 Organization-scoped)  
**Primary Purpose:** Vehicle categorization and fleet organization management

---

## Architecture Overview

### Multi-Tenant Organization Structure
```
Superadmin Routes (Global Access)
├── Global category management across all organizations
├── Cross-organization analytics and statistics
├── Administrative oversight and data management
└── Comprehensive relationship tracking

Organization-Scoped Routes (Tenant Isolation)
├── Session-based organization context (activeOrganizationId)
├── Category management within organization boundaries
├── Name uniqueness enforcement per organization
└── Relationship integrity within organization scope
```

### Core Business Logic
- **Category Classification**: Vehicles grouped by type, capacity, and purpose
- **Fleet Organization**: Systematic vehicle categorization for resource allocation
- **Request Targeting**: Vehicle requests specify desired category
- **Capacity Management**: Standard capacity definitions per category
- **Referential Integrity**: Prevention of deletion with active relationships

---

## Endpoint Summary Matrix

| Method | Route | Access Level | Purpose | Key Features |
|--------|-------|--------------|---------|--------------|
| **Superadmin Endpoints** |
| GET | `/superadmin` | Global | List all categories | Cross-org view, relationships, counts |
| GET | `/superadmin/:id` | Global | Get category by ID | Any organization access |
| GET | `/superadmin/by-organization/:orgId` | Global | Categories by org | Filtered organizational view |
| POST | `/superadmin` | Global | Create for any org | Requires organizationId |
| PUT | `/superadmin/:id` | Global | Update any category | Cross-org modification |
| DELETE | `/superadmin/:id` | Global | Delete any category | Global referential checks |
| GET | `/superadmin/:id/vehicles` | Global | Category vehicles | Include deleted option |
| GET | `/superadmin/:id/requests` | Global | Category requests | Cross-org request tracking |
| GET | `/superadmin/stats/summary` | Global | Global statistics | Comprehensive analytics |
| **Organization-Scoped Endpoints** |
| GET | `/` | Organization | List org categories | Simple, performant listing |
| GET | `/:id` | Organization | Get org category | With vehicle relationships |
| POST | `/` | Organization | Create in org | Auto org assignment |
| PUT | `/:id` | Organization | Update org category | Org-scoped validation |
| DELETE | `/:id` | Organization | Delete org category | Org-scoped integrity |

---

## Authentication & Permission Patterns

### Superadmin Authentication
```typescript
// Global access verification
const user = await auth.api.getSession({ headers: req.headers });
if (!user || user.user.role !== 'superadmin') {
  return res.status(403).json({ message: 'Access denied' });
}
```

### Organization-Scoped Authentication
```typescript
// Session-based organization context
const activeOrganizationId = req.session?.session?.activeOrganizationId;
if (!activeOrganizationId) {
  return res.status(400).json({ 
    message: 'Active organization not found' 
  });
}

// Organization-scoped data filtering
const categories = await prisma.vehicleCategory.findMany({
  where: { organizationId: activeOrganizationId }
});
```

### Permission Requirements
- **Superadmin Routes**: `role: 'superadmin'`
- **Organization Routes**: 
  - `vehicleCategory.read` - List and view categories
  - `vehicleCategory.create` - Create new categories
  - `vehicleCategory.update` - Modify categories
  - `vehicleCategory.delete` - Remove categories

---

## Data Schemas & Validation

### Create Category Schema (Zod)
```typescript
const CreateVehicleCategorySchema = z.object({
  name: z.string().min(1).transform(val => val.trim()),
  capacity: z.number().int().positive(),
  organizationId: z.string().optional() // Required for superadmin
});
```

### Update Category Schema (Zod)
```typescript
const UpdateVehicleCategorySchema = z.object({
  name: z.string().min(1).transform(val => val.trim()).optional(),
  capacity: z.number().int().positive().optional()
});
```

### Response Models
```typescript
// Simple Category (Organization-scoped list)
interface VehicleCategory {
  id: string;
  name: string;
  capacity: number;
  organizationId: string;
  createdAt: Date;
  updatedAt: Date;
}

// Detailed Category (Superadmin/specific queries)
interface DetailedVehicleCategory extends VehicleCategory {
  organization: Organization;
  vehicles: Vehicle[];
  vehicleRequests: VehicleRequest[];
  _count: {
    vehicles: number;
    vehicleRequests: number;
  };
}
```

---

## Key Business Rules

### **1. Name Uniqueness**
```typescript
// Within organization scope
const existingCategory = await prisma.vehicleCategory.findFirst({
  where: {
    name: trimmedName,
    organizationId,
    id: { not: categoryId } // For updates
  }
});

if (existingCategory) {
  return res.status(409).json({
    message: 'Category name already exists in this organization'
  });
}
```

### **2. Referential Integrity**
```typescript
// Deletion prevention with relationships
const category = await prisma.vehicleCategory.findUnique({
  where: { id },
  include: {
    vehicles: { where: { deleted: false } },
    vehicleRequests: true,
    _count: { select: { vehicles: true, vehicleRequests: true } }
  }
});

if (category.vehicles.length > 0 || category.vehicleRequests.length > 0) {
  return res.status(400).json({
    message: 'Cannot delete category with associated vehicles or requests',
    details: {
      vehicleCount: category._count.vehicles,
      requestCount: category._count.vehicleRequests
    }
  });
}
```

### **3. Organization Context Isolation**
```typescript
// Automatic organization assignment (org-scoped)
const newCategory = await prisma.vehicleCategory.create({
  data: {
    ...validatedData,
    organizationId: activeOrganizationId // Auto-assigned
  }
});

// Organization verification (access control)
const category = await prisma.vehicleCategory.findFirst({
  where: {
    id: categoryId,
    organizationId: activeOrganizationId // Scope restriction
  }
});
```

---

## Error Handling Patterns

### Standard Error Responses
```typescript
// 400 - Bad Request
{
  message: 'Active organization not found in session',
  // or
  message: 'Cannot delete category with associated vehicles or requests',
  details: { vehicleCount: 3, requestCount: 1 }
}

// 403 - Forbidden
{
  message: 'Access denied'
}

// 404 - Not Found
{
  message: 'Vehicle category not found'
}

// 409 - Conflict
{
  message: 'Category name already exists in this organization'
}

// 500 - Internal Error
{
  message: 'Internal server error'
}
```

### Validation Error Handling
```typescript
// Zod validation with detailed errors
const validation = CreateVehicleCategorySchema.safeParse(req.body);
if (!validation.success) {
  return res.status(400).json({
    message: 'Validation failed',
    errors: validation.error.format()
  });
}
```

---

## Database Integration

### Prisma Relationship Structure
```prisma
model VehicleCategory {
  id             String    @id @default(cuid())
  name           String
  capacity       Int
  organizationId String
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt

  organization     Organization     @relation(fields: [organizationId], references: [id])
  vehicles         Vehicle[]
  vehicleRequests  VehicleRequest[]

  @@unique([name, organizationId]) // Unique within organization
  @@map("vehicle_categories")
}
```

### Query Optimization Patterns
```typescript
// Performance-optimized listing (org-scoped)
const categories = await prisma.vehicleCategory.findMany({
  where: { organizationId: activeOrganizationId },
  orderBy: { name: 'asc' }
});

// Comprehensive querying (superadmin)
const categories = await prisma.vehicleCategory.findMany({
  include: {
    organization: { select: { id: true, name: true } },
    vehicles: { where: { deleted: false } },
    vehicleRequests: true,
    _count: { select: { vehicles: true, vehicleRequests: true } }
  },
  orderBy: { createdAt: 'desc' }
});
```

---

## Advanced Features

### **1. Global Statistics (Superadmin)**
```typescript
// Comprehensive analytics across organizations
const stats = {
  totalCategories: await prisma.vehicleCategory.count(),
  totalVehicles: await prisma.vehicle.count({ where: { deleted: false } }),
  totalRequests: await prisma.vehicleRequest.count(),
  averageCapacity: await prisma.vehicleCategory.aggregate({
    _avg: { capacity: true }
  }),
  categoriesByOrganization: await prisma.organization.findMany({
    include: {
      vehicleCategories: {
        include: {
          _count: { select: { vehicles: true, vehicleRequests: true } }
        }
      }
    }
  })
};
```

### **2. Category Vehicle Management**
```typescript
// Vehicle listing with deletion control
const vehicles = await prisma.vehicle.findMany({
  where: {
    vehicleCategoryId: categoryId,
    deleted: includeDeleted === 'true' ? undefined : false
  },
  include: {
    driver: true,
    organization: { select: { id: true, name: true } },
    routes: { where: { active: true } }
  }
});
```

### **3. Request Tracking**
```typescript
// Category-specific request monitoring
const requests = await prisma.vehicleRequest.findMany({
  where: { vehicleCategoryId: categoryId },
  include: {
    requestedBy: { select: { id: true, firstName: true, lastName: true } },
    organization: { select: { id: true, name: true } }
  },
  orderBy: { createdAt: 'desc' }
});
```

---

## Integration Points

### **1. Vehicle Management**
- Categories define vehicle classification
- Vehicle creation requires category assignment
- Category capacity influences vehicle specifications

### **2. Vehicle Requests**
- Requests target specific categories
- Category approval creates vehicles in specified category
- Category availability affects request fulfillment

### **3. Fleet Analytics**
- Category-based fleet composition analysis
- Capacity planning and optimization
- Resource allocation by category

### **4. Organization Management**
- Multi-tenant category isolation
- Organization-specific category naming
- Cross-organization administrative oversight

---

## Security Considerations

### **1. Data Isolation**
- Organization-scoped routes prevent cross-tenant access
- Session-based organization context verification
- Automatic organization assignment in creation

### **2. Permission Validation**
- Role-based access control (superadmin vs organization)
- Granular permissions for category operations
- Session authentication requirements

### **3. Input Validation**
- Comprehensive Zod schema validation
- SQL injection prevention through Prisma
- Data sanitization (automatic trimming)

### **4. Referential Integrity**
- Relationship validation before deletion
- Detailed dependency information
- Data consistency enforcement

---

## Performance Optimization

### **1. Query Efficiency**
- Selective field inclusion based on endpoint needs
- Optimized counting queries with `_count`
- Strategic relationship loading

### **2. Response Size Management**
- Lightweight responses for listing endpoints
- Detailed responses only when necessary
- Pagination-ready structure

### **3. Index Utilization**
- Unique constraints for name/organization pairs
- Organization-based query optimization
- Creation date indexing for sorting

---

## Development Patterns

### **1. Dual Access Pattern**
```typescript
// Superadmin: Global access with explicit organization
if (user.role === 'superadmin') {
  // Access any organization's data
  const categories = await prisma.vehicleCategory.findMany({
    where: { organizationId: targetOrgId }
  });
}

// Organization-scoped: Session-based context
else {
  const activeOrganizationId = req.session?.session?.activeOrganizationId;
  const categories = await prisma.vehicleCategory.findMany({
    where: { organizationId: activeOrganizationId }
  });
}
```

### **2. Validation Cascade Pattern**
```typescript
// 1. Authentication check
// 2. Permission verification  
// 3. Organization context validation
// 4. Input schema validation
// 5. Business rule validation
// 6. Database operation
// 7. Response formatting
```

### **3. Error Context Pattern**
```typescript
// Consistent error context across endpoints
try {
  // Operation logic
} catch (error) {
  console.error('Vehicle category operation failed:', error);
  return res.status(500).json({ 
    message: 'Internal server error'
  });
}
```

This comprehensive documentation covers all aspects of the vehicle categories API, providing developers with complete understanding of functionality, security, and integration patterns within the multi-tenant fleet management system.
