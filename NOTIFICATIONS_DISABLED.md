# Notifications Temporarily Disabled

## Overview
Notifications have been temporarily disabled in the frontend because they are not yet implemented on the server side.

## Changes Made

### App.jsx
- Commented out `NotificationDashboard` import
- Commented out `NotificationProvider` import
- Commented out `NotificationSound` import
- Commented out notifications route (`/notifications`)
- Commented out notification provider wrapper
- Disabled notification-specific cleanup code

### TopBar Component
- Commented out `NotificationDropdown` import
- Commented out `<NotificationDropdown />` component usage

### MobileNavMenu Component
- Disabled notifications-specific navigation workaround

### Constants
- Added commented out `NOTIFICATIONS` route with explanation

## To Re-enable Notifications

1. Implement notifications on the server side
2. Uncomment all the imports and components mentioned above
3. Add notifications route back to nav-config.ts if desired
4. Test that all notification functionality works properly

## Related Files
- `/packages/client/src/App.jsx`
- `/packages/client/src/components/Common/Layout/TopBar/index.jsx`
- `/packages/client/src/components/Common/Layout/TopBar/MobileNavMenu.jsx`
- `/packages/client/src/data/constants.js`
- `/packages/client/src/contexts/NotificationContext.tsx` (still exists but not used)
- `/packages/client/src/components/Common/Notifications/` (still exists but not used)
- `/packages/client/src/pages/notifications/` (still exists but not used)
