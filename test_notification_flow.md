# Real-time Notification System - Test Guide

## Setup Complete ✅

The real-time notification system has been implemented with:
- Socket.IO authentication middleware
- Notification broadcaster service
- Database + real-time dual delivery
- Client-side notification UI re-enabled

## Testing the Notification Flow

### 1. Start the Development Servers

```bash
pnpm dev
```

This starts:
- Client on `http://localhost:5173`
- Server on `http://localhost:3001`

### 2. Test Real-time Notifications

#### Option A: Using the API (Superadmin)

1. Login as a superadmin user
2. Send a POST request to create a notification:

```bash
curl -X POST http://localhost:3001/api/notifications/superadmin \
  -H "Content-Type: application/json" \
  -H "Cookie: better-auth.session_token=YOUR_SESSION_TOKEN" \
  -d '{
    "organizationId": "YOUR_ORG_ID",
    "title": "Test Notification",
    "message": "This is a real-time test notification",
    "toRoles": ["admin", "manager"],
    "type": "INFO",
    "importance": "MEDIUM"
  }'
```

3. The notification should:
   - Be saved to the database
   - Broadcast via Socket.IO to connected users in the organization
   - Appear in real-time on the client (no page refresh needed)

#### Option B: Using the Client UI

1. Navigate to `/notifications` in your browser
2. You should see the notification dashboard
3. Notifications will appear in real-time as they're created

### 3. Verify Socket.IO Connection

Open browser DevTools Console and look for:
```
[Socket] Client connected: <socket-id>, user: user@example.com, role: admin
```

### 4. Test Different Notification Types

The system supports:
- **Types**: INFO, WARNING, ALERT, SYSTEM
- **Importance**: LOW, MEDIUM, HIGH, CRITICAL
- **Targeting**: User-specific, role-based, org-wide

## Architecture Overview

### Backend Flow
```
API Request → broadcastNotification()
           ├─> notificationService.createNotification() (Database)
           └─> Socket.IO emit to rooms (Real-time)
                ├─> user:{userId}
                ├─> role:{roleName}
                └─> org:{organizationId}
```

### Frontend Flow
```
User connects → Socket.IO auth middleware
             ├─> Extract session from cookie
             ├─> Validate with Better Auth
             ├─> Attach user info to socket
             └─> Auto-join rooms (user, role, org)

Notification received → NotificationContext
                     ├─> Update local state
                     ├─> Play sound (if enabled)
                     └─> Show toast/badge
```

## Key Files Modified

### Server
- `/packages/server/src/lib/socket.ts` - Socket.IO auth middleware
- `/packages/server/src/lib/notificationBroadcaster.ts` - Broadcast helper
- `/packages/server/src/services/notificationService.ts` - Database operations
- `/packages/server/src/routes/notifications.ts` - API endpoints
- `/packages/server/src/index.ts` - Initialize broadcaster

### Client
- `/packages/client/src/App.jsx` - Re-enabled notification UI
- `/packages/client/src/contexts/NotificationContext/*` - Notification state management
- `/packages/client/src/components/Common/NotificationSound.jsx` - Audio notifications

## Known Issues

### Build Warnings (Non-blocking)
The following errors exist but don't affect notification functionality:
- `src/lib/auth/*` - Auth module type mismatches
- `src/routes.backup/*` - Deprecated route files using old schema

These are pre-existing issues unrelated to the notification system.

## Next Steps

1. **Test the flow**: Follow the testing guide above
2. **Fix auth errors**: Address the auth module type issues (optional)
3. **Clean up routes.backup**: Delete or update deprecated routes (optional)
4. **Add error handling**: 
   - Socket reconnection logic
   - Failed broadcast retry
   - Offline notification queue

## API Endpoints

### User Endpoints (Requires Auth)
- `GET /api/notifications` - Get user's notifications
- `GET /api/notifications/unread` - Get unread notifications
- `GET /api/notifications/unseen-count` - Get unread count
- `PATCH /api/notifications/:id/mark-seen` - Mark as read
- `POST /api/notifications/mark-all-seen` - Mark all as read

### Superadmin Endpoints
- `POST /api/notifications/superadmin` - Create & broadcast notification
- `GET /api/notifications/superadmin` - Get all notifications
- `GET /api/notifications/superadmin/stats/summary` - Get statistics

## Socket.IO Events

### Client → Server
- `notification:subscribe-role` - Subscribe to role notifications
- `notification:unsubscribe-role` - Unsubscribe from role
- `notification:mark-seen` - Notify others user saw notification
- `notification:mark-read` - Mark notification as read

### Server → Client
- `notification:new` - New notification broadcast
- `notification:seen` - User saw notification (broadcast to others)

## Troubleshooting

### Socket not connecting?
1. Check CORS configuration in `socket.ts`
2. Verify session cookie is being sent
3. Check browser console for auth errors

### Notifications not appearing in real-time?
1. Verify Socket.IO connection in DevTools
2. Check server logs for broadcast messages
3. Ensure user is in correct room (user/role/org)

### Database errors?
1. Run `npx prisma generate` after schema changes
2. Verify organizationId exists
3. Check notification payload matches schema types
