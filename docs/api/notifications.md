# Notifications API

## Overview
The Notifications API manages system notifications, alerts, and communication for fleet management operations including route updates, vehicle maintenance alerts, and administrative notifications.

## Base Route
```
/api/notifications
```

## Authentication & Permissions
- All endpoints require authentication
- Superadmin routes require `superadmin` role
- Organization-scoped routes require appropriate notification permissions

---

## Superadmin Endpoints

### GET /superadmin
**Get all notifications across all organizations**

### GET /superadmin/:id
**Get specific notification by ID**

### GET /superadmin/by-organization/:organizationId
**Get notifications for a specific organization**

### POST /superadmin
**Create a new notification**

### PUT /superadmin/:id
**Update a notification**

### DELETE /superadmin/:id
**Delete a notification**

### POST /superadmin/broadcast
**Send broadcast notification to all organizations**

### GET /superadmin/stats/engagement
**Get notification engagement statistics**

---

## Organization-Scoped Endpoints

### GET /
**Get notifications for user's organization**

### GET /:id
**Get specific notification**

### POST /
**Create notification**

### PUT /:id
**Update notification**

### DELETE /:id
**Delete notification**

### GET /unread
**Get unread notifications**

### PATCH /:id/read
**Mark notification as read**

### PATCH /mark-all-read
**Mark all notifications as read**

### GET /by-type/:type
**Get notifications by type**

### POST /user/:userId
**Send notification to specific user**

---

## Notification Model

```typescript
interface Notification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  priority: NotificationPriority;
  status: NotificationStatus;
  recipientId?: string;
  senderId?: string;
  metadata?: any;
  scheduledFor?: Date;
  sentAt?: Date;
  readAt?: Date;
  expiresAt?: Date;
  organizationId: string;
  
  // Relations
  organization: Organization;
  recipient?: User;
  sender?: User;
}
```

### Notification Types
- `ROUTE_UPDATE` - Route schedule or path changes
- `VEHICLE_MAINTENANCE` - Vehicle maintenance alerts
- `DRIVER_ASSIGNMENT` - Driver assignment notifications
- `SYSTEM_ALERT` - System-wide alerts
- `PAYMENT_REMINDER` - Payment and billing reminders
- `GENERAL` - General notifications

### Notification Priorities
- `LOW` - Low priority notifications
- `MEDIUM` - Medium priority notifications
- `HIGH` - High priority notifications
- `URGENT` - Urgent notifications requiring immediate attention

### Notification Status
- `PENDING` - Notification scheduled but not sent
- `SENT` - Notification has been sent
- `READ` - Notification has been read
- `EXPIRED` - Notification has expired

For detailed endpoint documentation, refer to the notifications.ts route file.
