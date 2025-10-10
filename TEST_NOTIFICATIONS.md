# Notification System Testing Guide

## Quick Test Steps

### 1. Test Real-Time Notifications

1. **Open two browser windows/tabs:**
   - Window A: Login as Admin/Manager
   - Window B: Login as Admin/Manager (same or different user)

2. **Create a notification trigger:**
   - In Window A, create a new vehicle:
     - Go to Vehicles → Add Vehicle
     - Fill in details and save
   - This should trigger a notification

3. **Verify real-time delivery:**
   - In Window B, watch the notification bell icon (top right)
   - Should see red badge appear with count "1"
   - Should hear notification sound (if enabled)
   - Click bell to see notification in dropdown

### 2. Test Unread Badge

1. **Check badge appears:**
   - After step 1 above, verify red badge shows on bell icon
   - Count should match number of unread notifications

2. **Test "Mark all read":**
   - Click notification bell
   - Click "Mark all read" button
   - Badge should disappear (count = 0)

3. **Test individual read:**
   - Create another notification
   - Click bell icon
   - Click on a single notification
   - Count should decrease by 1

### 3. Test Notifications Page

1. **Navigate to notifications:**
   - Click bell icon
   - Click "View All" button
   - OR navigate directly to `/notifications`

2. **Verify all notifications display:**
   - Should see list of all notifications
   - Filter by "All", "Unread", "Read" should work
   - Sort by time/importance should work
   - Pagination should work if > 10 notifications

3. **Check notification details:**
   - Each notification should show:
     - Icon (based on type)
     - Title/Subject
     - Message
     - Timestamp
     - Read/Unread status (visual indicator)

### 4. Test Different Notification Types

Create different types of notifications:

**Vehicle Notifications:**
- Add new vehicle → Should notify admins/managers
- Update vehicle status → Should notify relevant roles
- Delete vehicle → Should notify admins

**Route Notifications:**
- Create route → Notify drivers/managers
- Update route → Notify assigned driver
- Cancel route → Notify all involved

**Employee Notifications:**
- Add employee → Notify HR/managers
- Assign to route → Notify employee

### 5. Debug Console Checks

Open browser DevTools console and look for:

**Socket Connection:**
```
[SocketClient]: Socket connected
[SocketClient]: Subscribing to role: <your-role>
```

**New Notification Received:**
```
[SocketClient]: Received event: notification:new with data: {...}
[NotificationContext]: Received new notification: {...}
[NotificationContext]: Updated unread count from API: X
```

**Backend Logs (Server Console):**
```
[Socket] Client connected: <socket-id>, user: <email>, org role: <role>
[NotificationBroadcaster] Emitting to role:<role>
[NotificationBroadcaster] Emitting to org:<org-id>
```

## Troubleshooting

### Notifications Not Appearing

1. **Check socket connection:**
   - Open browser console
   - Look for "Socket connected" message
   - If not connected, check:
     - Server is running
     - CORS settings allow your origin
     - Cookie authentication working

2. **Check notification creation:**
   - Server logs should show notification creation
   - Check database for new notification entries

3. **Check room subscriptions:**
   - Console should show "Subscribing to role: X"
   - Backend should show user joined rooms

### Badge Not Updating

1. **Check unread count API:**
   - Open Network tab in DevTools
   - Look for `/api/notifications/unseen-count` calls
   - Should return `{ count: X }`

2. **Check status format:**
   - Notifications should have status 'UNREAD' or 'Pending'
   - Backend uses 'UNREAD', frontend supports both

### Sound Not Playing

1. **Check sound file exists:**
   - File should be at `/public/assets/sounds/notification.mp3`
   - Or update path in code

2. **Browser permissions:**
   - Some browsers block autoplay
   - User might need to interact with page first

## Expected Behavior

### ✅ Working Correctly When:
- [ ] New notifications appear in real-time (< 2 seconds)
- [ ] Red badge shows correct unread count
- [ ] Badge disappears when all marked as read
- [ ] Clicking notification navigates to relevant page
- [ ] Notifications page shows all notifications
- [ ] Filter and sort work correctly
- [ ] Sound plays on new notification
- [ ] Console shows debug logs (when DEBUG=true)

### ❌ Issues to Report:
- [ ] Notifications delayed > 5 seconds
- [ ] Badge count incorrect
- [ ] Socket disconnects frequently
- [ ] Notifications not showing in dropdown
- [ ] Notifications page empty or errors
- [ ] No sound on notification
- [ ] Console errors related to notifications

## Advanced Testing

### Test Organization Switching
1. User belongs to multiple orgs
2. Switch organization
3. Verify notifications update for new org
4. Old org notifications should not appear

### Test Role-Based Notifications
1. Login as different roles (admin, manager, driver, employee)
2. Create notifications targeted to specific roles
3. Verify each role sees only their notifications

### Test Notification Persistence
1. Create notifications
2. Refresh page
3. Verify unread count persists
4. Verify notifications still in dropdown

### Load Testing
1. Create 50+ notifications
2. Verify pagination works
3. Verify performance is acceptable
4. Check localStorage doesn't overflow

## Clean Up Debug Logs

After testing is complete, disable debug logging:

**File:** `/packages/client/src/contexts/NotificationContext.tsx`
```typescript
const DEBUG = false; // Change from true to false
```

**File:** `/packages/client/src/lib/socket.ts`
```typescript
const DEBUG = false; // Change from true to false
```

Then rebuild:
```bash
cd packages/client
pnpm build
```

---

**Testing Complete!** ✅
