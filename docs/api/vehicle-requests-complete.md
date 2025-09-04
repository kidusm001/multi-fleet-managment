# Vehicle Request Route Handlers - Complete Documentation

## Overview

This document provides a comprehensive overview of all vehicle request route handlers in the multi-fleet management system, including detailed implementations, approval workflows, and business logic for the vehicle request and approval process.

## Route Handler Summary

### **Superadmin Endpoints (Global Access)**

| Method | Endpoint | Description | Key Features |
|--------|----------|-------------|--------------|
| `GET` | `/superadmin` | Get all vehicle requests across organizations | Global overview, multi-filter support |
| `GET` | `/superadmin/:id` | Get specific vehicle request by ID | Cross-organization request access |
| `POST` | `/superadmin` | Create vehicle request for any organization | Global request creation |
| `PUT` | `/superadmin/:id` | Update any vehicle request | Cross-organization updates |
| `PATCH` | `/superadmin/:id/approve` | Approve vehicle request globally | Global approval workflow |
| `PATCH` | `/superadmin/:id/reject` | Reject vehicle request globally | Global rejection with comments |
| `DELETE` | `/superadmin/:id` | Delete any vehicle request | Global request deletion |
| `GET` | `/superadmin/stats/summary` | Global request statistics | Cross-organization analytics |

### **Organization-Scoped Endpoints (Multi-Tenant)**

| Method | Endpoint | Description | Key Features |
|--------|----------|-------------|--------------|
| `GET` | `/` | Get organization's vehicle requests | Session-based org filtering |
| `GET` | `/:id` | Get specific request in organization | Org-scoped request access |
| `POST` | `/` | Submit new vehicle request | Auto org assignment, workflow initiation |
| `PUT` | `/:id` | Update organization's request | Org-scoped updates |
| `DELETE` | `/:id` | Delete organization's request | Org-scoped deletion |
| `GET` | `/pending` | Get pending requests in organization | Status-filtered workflow management |
| `POST` | `/:id/approve` | **Approve and create vehicle** | **Request-to-vehicle conversion** |
| `POST` | `/:id/reject` | Reject with rejection comment | Workflow completion with audit |

---

## **Key Implementation Patterns**

### **1. Request-to-Vehicle Workflow**
The most important feature is the **automatic vehicle creation** when a request is approved:

```typescript
// POST /:id/approve implementation
const updatedRequest = await prisma.vehicleRequest.update({
    where: { id },
    data: {
        status: ApprovalStatus.APPROVED,
        approvedBy: 'admin',
        approvedAt: new Date(),
    },
});

// Create actual vehicle from approved request
const vehicle = await prisma.vehicle.create({
    data: {
        name: vehicleRequest.name,
        plateNumber: vehicleRequest.licensePlate,
        categoryId: vehicleRequest.categoryId,
        dailyRate: vehicleRequest.dailyRate,
        capacity: vehicleRequest.capacity,
        type: vehicleRequest.type,
        model: vehicleRequest.model,
        vendor: vehicleRequest.vendor,
        status: 'AVAILABLE',
        organizationId: vehicleRequest.organizationId,
    }
});
```

### **2. Multi-Status Workflow Management**
```typescript
// Status transition validation
if (vehicleRequest.status !== ApprovalStatus.PENDING) {
    return res.status(404).json({ 
        error: 'Vehicle request not found or already processed' 
    });
}
```

### **3. Organization-Scoped Permission System**
```typescript
const hasPermission = await auth.api.hasPermission({
    headers: await fromNodeHeaders(req.headers),
    body: {
        permissions: {
            vehicleRequest: ["update"],
            vehicle: ["create"] // Required for approval
        }
    }
});
```

---

## **Detailed Business Logic Documentation**

### **Request Lifecycle Management**

**1. Request Submission (POST /)**
- Fleet manager submits vehicle request
- Status automatically set to 'PENDING'
- Organization ID from session context
- Request timestamp recorded

**2. Request Review (GET /pending)**
- Admins view pending requests
- Organization-scoped filtering
- Complete request details available

**3. Request Decision (POST /:id/approve or POST /:id/reject)**
- **Approval**: Creates actual vehicle record + updates request
- **Rejection**: Records comment + updates request status
- Both update approval timestamp and approver

**4. Audit Trail**
- Complete history maintained
- Role-based approval tracking
- Comment system for decisions

### **Data Mapping: Request → Vehicle**

When a request is approved, the following data mapping occurs:

| Request Field | Vehicle Field | Transformation |
|---------------|---------------|----------------|
| `name` | `name` | Direct copy |
| `licensePlate` | `plateNumber` | Direct copy |
| `categoryId` | `categoryId` | Direct copy |
| `dailyRate` | `dailyRate` | Direct copy |
| `capacity` | `capacity` | Direct copy |
| `type` | `type` | Enum validation |
| `model` | `model` | Direct copy |
| `vendor` | `vendor` | Direct copy |
| `organizationId` | `organizationId` | Direct copy |
| - | `status` | Set to 'AVAILABLE' |

### **Permission Requirements by Operation**

| Operation | Required Permissions | Notes |
|-----------|---------------------|-------|
| List requests | `vehicleRequest.read` | Organization-scoped |
| View request | `vehicleRequest.read` | Organization-scoped |
| Create request | `vehicleRequest.create` | Auto org assignment |
| Update request | `vehicleRequest.update` | Organization-scoped |
| Delete request | `vehicleRequest.delete` | Organization-scoped |
| **Approve request** | `vehicleRequest.update` + `vehicle.create` | **Creates vehicle** |
| Reject request | `vehicleRequest.update` | Comment required |

---

## **Advanced Features Documented**

### **1. Global Statistics (Superadmin)**
```typescript
// GET /superadmin/stats/summary implementation
const totalRequests = await prisma.vehicleRequest.count();

const requestsByStatus = await prisma.vehicleRequest.groupBy({
    by: ['status'],
    _count: { id: true },
});

const requestsByOrg = await prisma.vehicleRequest.groupBy({
    by: ['organizationId'],
    _count: { id: true },
});
```

**Provides:**
- Total request count across all organizations
- Status distribution (PENDING/APPROVED/REJECTED)
- Organization-wise request breakdown

### **2. Multi-Filter Support (Superadmin)**
```typescript
// GET /superadmin with filters
const where: any = {};
if (organizationId) where.organizationId = organizationId;
if (status) where.status = status;
if (categoryId) where.categoryId = categoryId;
```

**Filter Options:**
- Organization ID filtering
- Status filtering
- Category ID filtering
- Combinable filters

### **3. Validation Schema System**
```typescript
// Zod schemas for data validation
export const CreateVehicleRequestSchema = BaseVehicleRequestSchema.extend({
  requestedBy: z.string().min(1, 'Requester role is required'),
});

export const ApproveVehicleRequestSchema = z.object({
  approverRole: z.string().min(1, 'Approver role is required'),
});

export const RejectVehicleRequestSchema = z.object({
  comment: z.string().min(1, 'Rejection comment is required'),
});
```

---

## **Integration Points**

### **1. Vehicle Creation Integration**
- **Seamless Pipeline**: Approved requests become vehicles immediately
- **Data Consistency**: All vehicle fields properly mapped from request
- **Status Management**: New vehicles start as 'AVAILABLE'
- **Organization Continuity**: Vehicle inherits organization context

### **2. Category System Integration**
- Vehicle requests can specify desired categories
- Category validation during request creation
- Category information carried to created vehicle

### **3. Permission System Integration**
- **Dual Permissions**: Approval requires both request and vehicle permissions
- **Role-Based Access**: Different permissions for different operations
- **Organization Scoping**: All permissions respect organization boundaries

### **4. Audit System Integration**
- Complete request lifecycle tracking
- Role-based approval/rejection recording
- Timestamp tracking for all state changes
- Comment system for decision reasoning

---

## **Error Handling Patterns**

### **Business Logic Errors**
```typescript
// Already processed requests
if (vehicleRequest.status !== ApprovalStatus.PENDING) {
    return res.status(404).json({ 
        error: 'Vehicle request not found or already processed' 
    });
}
```

### **Permission Errors**
```typescript
// Insufficient permissions
if (!hasPermission.success) {
    return res.status(403).json({ message: 'Unauthorized' });
}
```

### **Organization Context Errors**
```typescript
// Missing organization context
if (!activeOrgId) {
    return res.status(400).json({ message: 'Active organization not found' });
}
```

---

## **Performance Optimizations**

### **1. Efficient Queries**
- Relationship preloading with `include`
- Appropriate indexing on `organizationId` and `status`
- Optimized groupBy queries for statistics

### **2. Data Minimization**
- Selective field loading based on endpoint needs
- Efficient counting for statistics
- Filtered queries to reduce data transfer

### **3. Validation Efficiency**
- Early validation failures
- Schema-based validation with Zod
- Business rule validation before database operations

---

## **Security Considerations**

### **1. Organization Isolation**
- All organization-scoped queries include `organizationId` filtering
- Session-based organization context validation
- Prevention of cross-organization data access

### **2. Permission Validation**
- Granular permission checking per operation
- Role-based access control implementation
- Dual permission requirements for critical operations

### **3. Data Integrity**
- Request status validation before state changes
- Required field enforcement through schemas
- Consistent data mapping in request-to-vehicle conversion

---

## **Workflow Examples**

### **Complete Approval Workflow**
1. **Fleet Manager**: `POST /` - Submit vehicle request
2. **System**: Status = 'PENDING', Organization ID from session
3. **Admin**: `GET /pending` - Review pending requests
4. **Admin**: `POST /:id/approve` - Approve request
5. **System**: 
   - Update request status to 'APPROVED'
   - Create new vehicle record
   - Set vehicle status to 'AVAILABLE'
6. **Result**: Fleet has new vehicle ready for assignment

### **Rejection Workflow**
1. **Fleet Manager**: `POST /` - Submit vehicle request
2. **Admin**: `GET /pending` - Review pending requests
3. **Admin**: `POST /:id/reject` - Reject with comment
4. **System**: Update request status to 'REJECTED' with reason
5. **Result**: Request closed with audit trail

This comprehensive documentation provides complete coverage of all vehicle request route handlers with detailed workflow explanations, business logic insights, and practical implementation guidance for the request-to-vehicle approval system.
