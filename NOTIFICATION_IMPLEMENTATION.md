# Notification System - Complete Implementation Guide

## Overview
Comprehensive notification system with 90+ notification types, real-time WebSocket support, role-based filtering, and advanced UI features.

## Architecture

### Backend Components
- **Routes**: `/packages/server/src/routes/notifications.ts`
- **Service**: `/packages/server/src/services/notificationService.ts`
- **Broadcaster**: `/packages/server/src/lib/notificationBroadcaster.ts`
- **Schema**: `/packages/server/src/schema/notificationSchema.ts`

### Frontend Components
- **Dashboard**: `/packages/client/src/pages/notifications/components/notification-dashboard.tsx`
- **Item**: `/packages/client/src/pages/notifications/components/notification-item.tsx`
- **Dropdown**: `/packages/client/src/components/Common/Notifications/NotificationDropdown.tsx`
- **API Client**: `/packages/client/src/services/notificationApi.ts`

## Features Implemented

### 1. Notification Types (90+ types across 8 categories)

#### VEHICLE Category
- VEHICLE_ASSIGNED, VEHICLE_UNASSIGNED, VEHICLE_STATUS_CHANGED
- VEHICLE_MAINTENANCE_DUE, VEHICLE_MAINTENANCE_COMPLETED
- VEHICLE_FUEL_LOW, VEHICLE_FUEL_REFILLED
- VEHICLE_INSPECTION_DUE, VEHICLE_INSPECTION_COMPLETED
- VEHICLE_ACCIDENT_REPORTED, VEHICLE_BREAKDOWN
- VEHICLE_AVAILABILITY_CHANGED

#### ROUTE Category  
- ROUTE_CREATED, ROUTE_UPDATED, ROUTE_DELETED
- ROUTE_ASSIGNED, ROUTE_UNASSIGNED
- ROUTE_STATUS_CHANGED, ROUTE_DELAY, ROUTE_CANCELLED
- ROUTE_SCHEDULE_CHANGED, ROUTE_OPTIMIZATION_COMPLETED
- ROUTE_TRAFFIC_ALERT, ROUTE_STOP_ADDED, ROUTE_STOP_REMOVED

#### EMPLOYEE Category
- EMPLOYEE_ADDED, EMPLOYEE_REMOVED, EMPLOYEE_UPDATED
- EMPLOYEE_ABSENT, EMPLOYEE_ON_LEAVE
- EMPLOYEE_SHIFT_ASSIGNED, EMPLOYEE_SHIFT_CHANGED
- EMPLOYEE_PICKUP_SCHEDULED, EMPLOYEE_PICKUP_CANCELLED
- EMPLOYEE_EMERGENCY_CONTACT_UPDATED

#### DRIVER Category
- DRIVER_ASSIGNED, DRIVER_UNASSIGNED  
- DRIVER_SHIFT_START, DRIVER_SHIFT_END
- DRIVER_BREAK_START, DRIVER_BREAK_END
- DRIVER_LATE, DRIVER_ABSENT
- DRIVER_OVERTIME, DRIVER_LICENSE_EXPIRING

#### DEPARTMENT Category
- DEPARTMENT_CREATED, DEPARTMENT_UPDATED, DEPARTMENT_DELETED
- DEPARTMENT_EMPLOYEE_ADDED, DEPARTMENT_EMPLOYEE_REMOVED
- DEPARTMENT_ROUTE_ASSIGNED, DEPARTMENT_SCHEDULE_CHANGED

#### SHIFT Category
- SHIFT_CREATED, SHIFT_UPDATED, SHIFT_DELETED
- SHIFT_ASSIGNED, SHIFT_UNASSIGNED
- SHIFT_SWAP_REQUESTED, SHIFT_SWAP_APPROVED, SHIFT_SWAP_REJECTED
- SHIFT_OVERTIME_REQUESTED, SHIFT_OVERTIME_APPROVED

#### SYSTEM Category
- SYSTEM_UPDATE, SYSTEM_MAINTENANCE, SYSTEM_ERROR
- SYSTEM_BACKUP_COMPLETED, SYSTEM_BACKUP_FAILED
- SYSTEM_ALERT, SYSTEM_CRITICAL_ALERT

#### SECURITY Category
- SECURITY_LOGIN_ATTEMPT, SECURITY_PASSWORD_CHANGED
- SECURITY_ROLE_CHANGED, SECURITY_PERMISSION_CHANGED
- SECURITY_SUSPICIOUS_ACTIVITY, SECURITY_ACCOUNT_LOCKED

### 2. Importance Levels
- **CRITICAL**: Immediate action required (red background)
- **HIGH**: Important, needs attention soon (orange background)
- **MEDIUM**: Standard priority (yellow background)
- **LOW**: Informational (blue background)

### 3. Filtering & Sorting
- **Read Status**: All / Unread / Read tabs
- **Type Filter**: All / Routes / Vehicles / Employees (expandable tabs)
- **Importance Filter**: All / Critical / High / Medium / Low
- **Date Range**: From-To date picker
- **Sort By**: Time (newest first) / Importance (critical first)

### 4. UI Features
- Severity-based colored backgrounds
- Better emoji icons for each notification type
- Expandable notification cards for long content
- Bulk selection and actions (Mark as Read/Unread)
- Real-time badge counts in navigation
- Responsive pagination

### 5. Real-Time Updates
- WebSocket connection for instant notifications
- Automatic badge count updates
- Live notification feed in dropdown
- Sound notifications (configurable)

## API Endpoints

### GET `/api/notifications`
Get all notifications with filters
- Query params: `page`, `limit`, `type`, `importance`, `fromDate`, `toDate`
- Returns paginated notification list

### GET `/api/notifications/unread`
Get unread notifications
- Query params: `page`, `limit`, `type`, `importance`, `fromDate`, `toDate`
- Returns unread notifications with filters applied

### GET `/api/notifications/read`
Get read notifications  
- Query params: `page`, `limit`, `type`, `importance`, `fromDate`, `toDate`
- Returns read notifications with filters applied

### GET `/api/notifications/sorted-by-importance`
Get notifications sorted by importance
- Query params: `page`, `limit`, `type`, `importance`, `fromDate`, `toDate`
- Returns: CRITICAL → HIGH → MEDIUM → LOW order

### PATCH `/api/notifications/:id/mark-read`
Mark single notification as read

### PATCH `/api/notifications/:id/mark-unread`
Mark single notification as unread

### POST `/api/notifications/mark-all-read`
Mark all notifications as read

### DELETE `/api/notifications/:id`
Delete a notification

## Database Schema

```prisma
model Notification {
  id                String             @id @default(cuid())
  organizationId    String
  title             String
  message           String
  toRoles           String[]
  fromRole          String?
  type              NotificationType   @default(INFO)
  importance        ImportanceLevel    @default(MEDIUM)
  userId            String?
  relatedEntityId   String?
  status            NotificationStatus @default(UNREAD)
  createdAt         DateTime           @default(now())
  updatedAt         DateTime           @updatedAt
  
  organization      Organization       @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  seenBy            NotificationSeen[]
}

model NotificationSeen {
  id             String       @id @default(cuid())
  userId         String
  notificationId String
  seenAt         DateTime     @default(now())
  readAt         DateTime?
  
  notification   Notification @relation(fields: [notificationId], references: [id], onDelete: Cascade)
  
  @@unique([userId, notificationId])
}
```

## Permissions

Uses better-auth organization plugin with role-based access:
- **READ**: View notifications
- **CREATE**: Create new notifications (admin/manager)
- **UPDATE**: Modify notification settings
- **DELETE**: Remove notifications

## WebSocket Events

- `notification:new` - New notification broadcast
- `notification:read` - Notification marked as read
- `notification:count` - Badge count update

## Known Issues & Fixes Applied

### Issue 1: Read/Unread Tab Not Working ✅ FIXED
- **Problem**: Filters (type, date, importance) not passed to read/unread endpoints
- **Solution**: Updated dashboard to pass all filters to getUnread/getRead API calls

### Issue 2: Background Colors Not Showing ✅ FIXED
- **Problem**: Severity colors not applied to notification cards
- **Solution**: Updated getSeverityColor() to return full bg-* Tailwind classes

### Issue 3: Type Filter Not Working ✅ FIXED  
- **Problem**: Using lowercase "route" instead of enum "ROUTE"
- **Solution**: Changed filter values to match NotificationType enum

### Issue 4: Sort by Importance Not Working ✅ FIXED
- **Problem**: Date filters not passed to sorted endpoint
- **Solution**: Added fromDate/toDate to getSortedByImportance

### Issue 5: Date Filter Not Working ✅ FIXED
- **Problem**: Date objects not converted to ISO strings
- **Solution**: Added .toISOString() conversion before API calls

## Configuration

### Environment Variables
```env
VITE_WS_URL=ws://localhost:3000
VITE_API_BASE=http://localhost:3000
```

### Feature Flags
```typescript
// Enable/disable notification sounds
ENABLE_NOTIFICATION_SOUNDS=true

// Max notifications in dropdown
MAX_DROPDOWN_NOTIFICATIONS=10

// Notification retention (days)
NOTIFICATION_RETENTION_DAYS=30
```

## Testing

See `NOTIFICATION_TESTING.md` for comprehensive testing guide.

## Migration Notes

When upgrading from old notification system:
1. Run database migration for new schema
2. Update notification type references to new enum values
3. Update API calls to use new filter structure
4. Test WebSocket connection
5. Verify role-based permissions

## Performance Optimizations

- Pagination (10 items per page default)
- Database indexes on organizationId, userId, createdAt, type
- Efficient read/unread queries using NotificationSeen junction table
- WebSocket connection pooling
- Cached badge counts

## Future Enhancements

- [ ] Email digest notifications
- [ ] Push notifications (mobile)
- [ ] Notification templates
- [ ] Custom notification rules
- [ ] Analytics dashboard
- [ ] Notification scheduling
- [ ] Bulk operations API
- [ ] Export notifications (CSV/PDF)
