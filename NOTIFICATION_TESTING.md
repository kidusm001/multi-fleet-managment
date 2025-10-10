# Notification System - Testing Guide

## Quick Test (15 minutes)

### Test Coverage:
- [x] Backend integration (all routes integrated)
- [x] Frontend UI (severity styling complete)
- [ ] Manual testing (checklist provided)
- [ ] Real-time delivery (needs user testing)

### How to Test:
```bash
# 1. Start servers
pnpm dev

# 2. Open browser
# - Create a vehicle → Check admin notification
# - Assign driver → Check multi-recipient
# - Set maintenance → Check CRITICAL severity

# 3. Check UI
# - Verify red border for CRITICAL
# - Verify orange border for HIGH
# - Test severity filter dropdown
```

## Quick Start Testing

### 1. Start the Application
```bash
# Terminal 1: Start backend
cd packages/server
pnpm dev

# Terminal 2: Start frontend  
cd packages/client
pnpm dev
```

### 2. Access Notification Pages
- **Dropdown**: Click bell icon in navigation (any page)
- **Full Page**: Navigate to http://localhost:5173/notifications

## Test Scenarios

### A. Basic Functionality

#### Test 1: View All Notifications
1. Navigate to `/notifications`
2. Verify notifications are displayed with:
   - ✅ Colored backgrounds (red/orange/yellow/blue based on severity)
   - ✅ Emoji icons matching notification type
   - ✅ Title and description
   - ✅ Timestamp
   - ✅ Read/unread status

**Expected**: Paginated list of notifications with proper styling

#### Test 2: Mark as Read/Unread
1. Select notification checkbox
2. Click "Mark as Read" button
3. Verify notification moves to "Read" tab
4. Select read notification
5. Click "Mark as Unread"
6. Verify notification moves back to "Unread" tab

**Expected**: Notifications toggle between read/unread states

#### Test 3: Real-Time Updates
1. Open `/notifications` in two browser tabs
2. Mark notification as read in Tab 1
3. Verify badge count updates in Tab 2 navigation
4. Check dropdown in Tab 2 shows updated state

**Expected**: WebSocket updates reflected instantly

### B. Filtering Tests

#### Test 4: Read Status Filter
1. Click "All" tab → See all notifications
2. Click "Unread" tab → See only unread (no read badge)
3. Click "Read" tab → See only read notifications

**Expected**: Each tab shows correct subset

#### Test 5: Type Filter
1. Click "Routes" expandable tab
2. Verify only ROUTE_* notifications shown
3. Click "Vehicles" tab
4. Verify only VEHICLE_* notifications shown
5. Click "All" to reset

**Expected**: Type filtering works correctly

#### Test 6: Importance Filter
1. Select "Critical" from importance dropdown
2. Verify only CRITICAL importance shown (red backgrounds)
3. Select "High" 
4. Verify only HIGH importance shown (orange backgrounds)
5. Test "Medium" and "Low" similarly

**Expected**: Importance filtering works with correct colors

#### Test 7: Date Range Filter
1. Click date range picker
2. Select "Last 7 days"
3. Verify notifications from last week shown
4. Select custom range (e.g., Oct 1-5)
5. Verify only notifications in range shown

**Expected**: Date filtering works correctly

#### Test 8: Sort by Importance
1. Select "Sort by: Importance" from dropdown
2. Verify order: CRITICAL → HIGH → MEDIUM → LOW
3. Check notifications within same importance sorted by time (newest first)

**Expected**: Proper sorting order maintained

### C. Combined Filters Test

#### Test 9: Multiple Filters Together
1. Select "Unread" tab
2. Choose "Vehicles" type filter
3. Select "High" importance
4. Set date range to "Last 30 days"
5. Verify results match ALL filters

**Expected**: All filters applied simultaneously

#### Test 10: Sort + Filters
1. Apply filters: Type=Routes, Importance=Critical, Date=Last 7 days
2. Select "Sort by Importance"
3. Verify sorted results still respect filters

**Expected**: Sorting works with active filters

### D. Bulk Actions Test

#### Test 11: Select All
1. Click "Select All" checkbox in header
2. Verify all visible notifications selected
3. Click "Mark as Read"
4. Verify all selected notifications marked as read
5. Refresh stats to see updated counts

**Expected**: Bulk operations work correctly

#### Test 12: Partial Selection
1. Manually select 3 notifications
2. Click "Mark as Unread"
3. Verify only selected 3 changed status

**Expected**: Partial selection operations work

### E. Pagination Test

#### Test 13: Page Navigation
1. If total > 10 notifications, verify pagination controls shown
2. Click "Next Page"
3. Verify new set of notifications loaded
4. Click "Previous Page"
5. Verify original notifications shown

**Expected**: Pagination works smoothly

#### Test 14: Filters Persist Across Pages
1. Apply filter: Type=Routes, Importance=High
2. Navigate to Page 2
3. Verify filters still applied
4. Check only matching notifications shown

**Expected**: Filters maintained during pagination

### F. Dropdown Notification Test

#### Test 15: Navigation Dropdown
1. Click bell icon in navigation
2. Verify dropdown shows:
   - Latest 5 notifications
   - Unread count badge
   - "View All" link
   - Mark as read on click
3. Click notification in dropdown
4. Verify marked as read
5. Check `/notifications` page reflects change

**Expected**: Dropdown syncs with main page

#### Test 16: Badge Count
1. Note current unread count in badge
2. Mark notification as read
3. Verify badge count decrements
4. Mark as unread
5. Verify badge count increments

**Expected**: Badge always shows accurate unread count

### G. Background Colors Test

#### Test 17: Severity Colors
1. Navigate to `/notifications`
2. Find CRITICAL notification
3. Verify: `bg-red-100` background + `border-red-600` left border (light mode)
4. Toggle dark mode
5. Verify: `bg-red-950/30` background (dark mode)
6. Repeat for HIGH (orange), MEDIUM (yellow), LOW (blue)

**Expected**: Each severity has distinct colored background

#### Test 18: Badge Display
1. Find CRITICAL notification
2. Verify red "CRITICAL" badge shown
3. Find HIGH notification  
4. Verify orange "HIGH" badge shown
5. Check MEDIUM and LOW similarly

**Expected**: Severity badges display correctly

### H. Edge Cases

#### Test 19: Empty States
1. Apply filters that return no results
2. Verify "No notifications found" message shown
3. Clear filters
4. Verify notifications reappear

**Expected**: Graceful empty state handling

#### Test 20: Long Content
1. Find notification with long description (>120 chars)
2. Verify card height constrained (88px)
3. Click to expand
4. Verify full content shown
5. Click again to collapse

**Expected**: Expandable content works

### I. API Integration Test

#### Test 21: Network Error Handling
1. Stop backend server
2. Try marking notification as read
3. Verify error message shown
4. Restart server
5. Retry operation
6. Verify success

**Expected**: Graceful error handling

#### Test 22: Concurrent Updates
1. Open two tabs
2. Mark same notification as read in both tabs (quickly)
3. Verify no duplicate/conflict errors
4. Check final state is consistent

**Expected**: Concurrent operations handled safely

## Automated Testing

### Unit Tests
```bash
cd packages/client
pnpm test notification-dashboard.test.tsx
```

### Integration Tests
```bash
cd packages/server
pnpm test notifications.test.ts
```

### E2E Tests (Playwright)
```bash
pnpm test:e2e notifications.spec.ts
```

## Performance Testing

### Load Test
1. Create 1000+ notifications
2. Navigate to `/notifications`
3. Verify page loads within 2 seconds
4. Apply filters
5. Verify filter response < 500ms

### Memory Test
1. Open `/notifications`
2. Leave page open for 30 minutes
3. Monitor memory usage
4. Verify no memory leaks

## Accessibility Testing

### Keyboard Navigation
1. Tab through notification list
2. Verify focus indicators visible
3. Press Space/Enter to select
4. Use arrow keys for navigation

### Screen Reader
1. Enable screen reader (NVDA/JAWS)
2. Navigate notifications
3. Verify proper ARIA labels announced
4. Check button/link descriptions clear

## Browser Compatibility

Test on:
- ✅ Chrome 120+
- ✅ Firefox 120+  
- ✅ Safari 17+
- ✅ Edge 120+

## Mobile Testing

Test on:
- ✅ iOS Safari (iPhone)
- ✅ Chrome Mobile (Android)
- ✅ Responsive breakpoints (375px, 768px, 1024px)

## Test Checklist

### Before Release
- [ ] All filter types work independently
- [ ] Combined filters work together
- [ ] Sort options work with filters
- [ ] Pagination preserves filters
- [ ] Background colors display correctly
- [ ] Real-time updates work
- [ ] Dropdown syncs with main page
- [ ] Badge counts accurate
- [ ] Bulk actions work
- [ ] Error handling graceful
- [ ] Performance acceptable (<2s load)
- [ ] Accessibility compliant
- [ ] Cross-browser compatible
- [ ] Mobile responsive

### Regression Tests (After Changes)
- [ ] All filtering still works
- [ ] Background colors intact
- [ ] WebSocket connection stable
- [ ] No console errors
- [ ] Database queries optimized
- [ ] API responses correct format

## Common Issues & Solutions

### Issue: Filters Not Working
**Check**: 
- Console for API errors
- Network tab for request params
- Backend logs for query issues

### Issue: Background Colors Missing
**Check**:
- `getSeverityColor()` returning correct Tailwind classes
- `importance.label` has correct value
- Tailwind CSS compiled properly

### Issue: Real-Time Updates Not Working
**Check**:
- WebSocket connection established (Network → WS tab)
- Event listeners attached properly
- Backend broadcasting enabled

### Issue: Dropdown Not Syncing
**Check**:
- NotificationContext provider wrapping app
- Event emitters firing on state change
- Shared state management working

## Debug Commands

```bash
# Check backend logs
pnpm --filter server dev --debug

# Check WebSocket messages
# In browser console:
localStorage.debug = 'socket.io-client:*'

# Inspect database
npx prisma studio

# Clear notification cache
# In browser console:
localStorage.clear()
sessionStorage.clear()
```

## Reporting Bugs

When reporting issues, include:
1. Steps to reproduce
2. Expected vs actual behavior
3. Browser/OS version
4. Console errors (if any)
5. Network requests (HAR file)
6. Screenshots/video
