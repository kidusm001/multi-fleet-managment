# Multi-Fleet Management API Documentation

This documentation provides comprehensive details about all API endpoints in the Multi-Fleet Management system.

## Base URL
```
/api
```

## Authentication
All routes require authentication using Bearer tokens (Better Auth integration). Some routes additionally require specific role-based permissions.

## Route Modules

### Core Resources
- [**Vehicles**](./vehicles.md) - Vehicle fleet management
- [**Vehicle Categories**](./vehicle-categories.md) - Vehicle classification and categorization
- [**Departments**](./departments.md) - Organizational department management
- [**Employees**](./employees.md) - Employee and workforce management
- [**Drivers**](./drivers.md) - Driver management and assignment
- [**Shifts**](./shifts.md) - Work shift scheduling
- [**Routes**](./routes.md) - Transportation route management
- [**Stops**](./stops.md) - Route stop locations and management

### Operational Resources  
- [**Vehicle Availability**](./vehicle-availability.md) - Vehicle scheduling and availability
- [**Vehicle Requests**](./vehicle-requests.md) - Vehicle request and approval workflow
- [**Notifications**](./notifications.md) - System notification management
- [**Payroll Reports**](./payroll-reports.md) - Payroll and reporting functionality

### Advanced Features
- [**Cluster**](./cluster.md) - Route optimization and clustering algorithms

## Permission Levels

### Superadmin Routes
Routes prefixed with `/superadmin` require **superadmin** role privileges and provide cross-organizational access:
- Full CRUD operations across all organizations
- Access to deleted/archived records
- System-wide statistics and reporting
- Advanced management capabilities

### Organization-Scoped Routes
Standard routes (without `/superadmin` prefix) are organization-scoped:
- Limited to user's assigned organization
- Standard CRUD operations
- Organization-specific data access
- Employee/manager level permissions

## Common Response Patterns

### Success Responses
```json
{
  "id": "string",
  "data": {...},
  "message": "Success message"
}
```

### Error Responses
```json
{
  "message": "Error description",
  "error": "Error type",
  "statusCode": 400
}
```

### Validation Errors
```json
{
  "message": "Validation failed",
  "errors": [
    {
      "field": "fieldName",
      "message": "Validation error message"
    }
  ]
}
```

## Common Query Parameters

### Pagination (where applicable)
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10)

### Filtering
- `includeDeleted` - Include soft-deleted records (superadmin only)
- Various resource-specific filters documented in individual route files

### Sorting
- `sortBy` - Field to sort by
- `sortOrder` - 'asc' or 'desc'

## Schema Validation

The API uses Zod schemas for request validation. Each endpoint specifies:
- Required request body schema
- Parameter validation rules  
- Query parameter constraints

## Rate Limiting

API endpoints may be subject to rate limiting based on:
- User role and permissions
- Organization tier
- Endpoint sensitivity

## Development Notes

This API is currently in active development with Better Auth integration. Some legacy endpoints may be marked as deprecated and will be updated to the new authentication system.

For specific endpoint details, request/response schemas, and usage examples, refer to the individual route documentation files linked above.
