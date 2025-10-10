# Driver Portal - Mobile Interface

## Overview
The Driver Portal is a mobile-optimized interface designed for drivers to manage their routes, navigate to stops, and track their performance. Built with a mobile-first approach, it provides an intuitive touch-friendly experience.

## Features

### ✅ Implemented (Phase 1)
- **Mobile-First Layout** - Responsive design optimized for phones and tablets
- **Bottom Tab Navigation** - Easy thumb-friendly navigation
- **Dashboard View** - Active routes, stats, and upcoming shifts
- **Routes List** - Filterable list (Active/Upcoming/Completed)
- **Theme Support** - Full dark/light mode
- **Auto-Refresh** - Live data updates every 30 seconds

### 🚧 In Progress (Phase 2)
- **Route Details** - Stop-by-stop itinerary with passenger info
- **Map Navigation** - Real-time turn-by-turn navigation
- **Weekly Schedule** - Calendar view of shifts
- **Driver Profile** - Stats and settings

### 📋 Planned (Phase 3)
- **Offline Support** - PWA with service workers
- **Push Notifications** - Route updates and alerts
- **Voice Navigation** - Hands-free directions
- **Real-time Tracking** - Live location sharing
- **Incident Reporting** - In-app issue reporting

## File Structure

```
packages/client/src/pages/DriverPortal/
├── index.jsx                          # Root component with routing
├── MobileDriverPortal.jsx            # Mobile layout wrapper
│
├── components/                        # Reusable components
│   ├── MobileTopBar.jsx              # Header with logo & notifications
│   ├── MobileBottomNav.jsx           # Tab navigation
│   ├── DriverGreeting.jsx            # Welcome message
│   ├── ActiveRouteCard.jsx           # Current route display
│   ├── QuickStatsGrid.jsx            # Stats cards (stops/time/distance)
│   ├── UpcomingShiftsList.jsx        # Next assignments
│   └── RouteListCard.jsx             # Route list item
│
└── views/                             # Page views
    ├── Dashboard.jsx                  # Main dashboard
    ├── RoutesList.jsx                 # Routes list with filters
    ├── RouteDetail.jsx                # Route details (WIP)
    ├── Navigation.jsx                 # Map navigation (WIP)
    ├── Schedule.jsx                   # Weekly schedule (WIP)
    └── Profile.jsx                    # Driver profile (WIP)
```

## Routing

| Path | Component | Description |
|------|-----------|-------------|
| `/driver` | Dashboard | Main landing page |
| `/driver/routes` | RoutesList | All routes with filters |
| `/driver/route/:id` | RouteDetail | Specific route details |
| `/driver/navigate/:routeId/:stopId` | Navigation | Turn-by-turn navigation |
| `/driver/schedule` | Schedule | Weekly calendar |
| `/driver/profile` | Profile | Driver stats & settings |

## API Integration

### Driver Service Methods

```javascript
import { driverService } from '@services/driverService';

// Get active route
const activeRoute = await driverService.getActiveRoute();

// Get all routes with filters
const routes = await driverService.getRoutes({ 
  status: 'ACTIVE',
  date: '2025-01-15' 
});

// Get specific route
const route = await driverService.getRoute(routeId);

// Update route status
await driverService.updateRouteStatus(routeId, 'COMPLETED');

// Mark passenger picked up
await driverService.markStopCompleted(routeId, stopId, {
  location: { lat, lng },
  notes: 'Passenger picked up'
});

// Get weekly schedule
const schedule = await driverService.getSchedule({
  from: '2025-01-15',
  to: '2025-01-21'
});

// Get upcoming shifts
const shifts = await driverService.getUpcomingShifts(5);

// Update driver location
await driverService.updateLocation({
  latitude: 9.0221,
  longitude: 38.7468,
  heading: 45,
  speed: 30
});

// Get driver stats
const stats = await driverService.getStats('month');
```

## Responsive Design

### Breakpoints
- **Mobile:** < 640px (primary target)
- **Tablet:** 641-1024px (enhanced layout)
- **Desktop:** >= 1025px (redirect to main dashboard)

### Viewport Hook
```javascript
import { useViewport } from '@hooks/useViewport';

const MyComponent = () => {
  const viewport = useViewport(); // 'mobile' | 'tablet' | 'desktop'
  
  if (viewport === 'mobile') {
    return <MobileView />;
  }
  // ...
};
```

### Force Mobile View
The portal automatically shows mobile view for users with driver role on any device.

## Theming

### Color System
```css
/* Primary */
--primary: #f3684e;           /* Main brand color */
--primary-dark: #e55a28;      /* Hover states */

/* Status Colors */
--active: #10B981;            /* Green - active routes */
--pending: #3B82F6;           /* Blue - upcoming */
--completed: #6B7280;         /* Gray - completed */

/* Dark Mode */
--bg-dark: #0c1222;           /* Main background */
--surface-dark: #1a2327;      /* Card background */
--text-dark: #F3F4F6;         /* Text color */
```

### Using Theme
```javascript
import { useTheme } from '@contexts/ThemeContext';

const MyComponent = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  return (
    <div className={isDark ? 'bg-gray-900' : 'bg-white'}>
      {/* ... */}
    </div>
  );
};
```

## Testing

### Access Driver Portal

1. **Navigate to portal:**
   ```
   http://localhost:5173/driver
   ```

2. **Auto-mobile view:**
   - Resize browser to < 640px width
   - Or use DevTools mobile emulation
   - Portal shows automatically on small screens

3. **Driver account:**
   - Login as a driver (user with driver role)
   - Portal accessible on any device for drivers

### Find Test Driver Account

```sql
-- Query database for driver email
SELECT email FROM drivers 
WHERE organizationId = 'your-org-id' 
LIMIT 1;
```

Then login with that email.

### Test Scenarios

**Dashboard:**
- [x] Shows greeting with driver name
- [x] Displays active route card (if exists)
- [x] Shows stats grid when route active
- [x] Lists upcoming shifts
- [x] Empty state when no routes
- [x] Auto-refreshes every 30 seconds

**Routes List:**
- [x] Filter by Active/Upcoming/Completed
- [x] Color-coded by status
- [x] Progress bar for active routes
- [x] Navigate to route details
- [x] Empty state per filter

**Navigation:**
- [x] Bottom tabs work
- [x] Back navigation
- [x] Theme switching
- [x] Notification bell with badge
- [ ] Pull-to-refresh (WIP)

## Development

### Running Locally

```bash
# Install dependencies
pnpm install

# Start dev server
pnpm dev

# Access portal
# http://localhost:5173/driver
```

### Creating New View

1. Create view file:
```javascript
// views/MyView.jsx
import React from 'react';
import { useTheme } from '@contexts/ThemeContext';

function MyView() {
  const { theme } = useTheme();
  
  return (
    <div className="py-4">
      {/* Your content */}
    </div>
  );
}

export default MyView;
```

2. Add route in `index.jsx`:
```javascript
<Route path="my-view" element={<MyView />} />
```

3. Add to bottom nav (if needed):
```javascript
// components/MobileBottomNav.jsx
const navItems = [
  // ... existing items
  { path: '/driver/my-view', label: 'MyView', icon: MyIcon }
];
```

### Component Guidelines

**Mobile-First:**
- Use `px-4` (16px) padding on mobile
- Increase to `px-6` (24px) on tablet
- Min touch target: 44px (iOS/Android standard)

**Theme-Aware:**
```javascript
className={cn(
  "base-classes",
  isDark ? "dark-classes" : "light-classes"
)}
```

**Responsive Text:**
```javascript
className="text-sm sm:text-base lg:text-lg"
```

## Backend Integration

### Required API Endpoints

Create these in `/packages/server/src/routes/driver-portal.ts`:

```typescript
// Get driver's routes
router.get('/drivers/me/routes', requireAuth, requireRole(['driver']), 
  async (req, res) => {
    const { date, status } = req.query;
    // ... implementation
  }
);

// Get route details for driver
router.get('/routes/:id/driver-view', requireAuth, requireRole(['driver']),
  async (req, res) => {
    // ... implementation
  }
);

// Update route status
router.patch('/routes/:id/status', requireAuth, requireRole(['driver']),
  async (req, res) => {
    // ... implementation
  }
);

// Mark passenger picked up
router.post('/routes/:routeId/stops/:stopId/checkin', requireAuth, 
  requireRole(['driver']), async (req, res) => {
    // ... implementation
  }
);

// Get driver schedule
router.get('/drivers/me/schedule', requireAuth, requireRole(['driver']),
  async (req, res) => {
    // ... implementation
  }
);

// Update driver location
router.post('/drivers/me/location', requireAuth, requireRole(['driver']),
  async (req, res) => {
    // ... implementation
  }
);

// Get driver stats
router.get('/drivers/me/stats', requireAuth, requireRole(['driver']),
  async (req, res) => {
    // ... implementation
  }
);
```

## Next Steps

### Phase 2: Core Functionality
1. **Implement Backend APIs** - Create all driver portal endpoints
2. **Route Detail View** - Stop-by-stop list with passenger info
3. **Map Navigation** - Integrate Mapbox/Google Maps
4. **Weekly Schedule** - Calendar component with date navigation
5. **Driver Profile** - Stats display and settings

### Phase 3: Advanced Features
1. **Real-time Tracking** - WebSocket location updates
2. **Push Notifications** - Route alerts and updates
3. **Offline Support** - PWA with service workers
4. **Voice Navigation** - Text-to-speech directions
5. **Photo Upload** - Delivery proof/incident reports

### Phase 4: Polish & Optimization
1. **Performance** - Lazy loading, code splitting
2. **Animations** - Smooth transitions and interactions
3. **Accessibility** - WCAG 2.1 AA compliance
4. **Testing** - Unit, integration, and E2E tests
5. **Documentation** - User guides and API docs

## Troubleshooting

### Portal Not Showing
- Check route is correct: `/driver`
- Verify user has driver role
- Clear browser cache and reload
- Check console for errors

### Routes Not Loading
- Verify backend API is running
- Check network tab for failed requests
- Ensure driver has assigned routes
- Check authentication token

### Theme Not Working
- Verify ThemeProvider wraps app
- Check localStorage for theme preference
- Inspect CSS classes in DevTools

### Bottom Nav Not Visible
- Check viewport height (not on navigation view?)
- Verify route matches pattern
- Check z-index conflicts

## Contributing

1. Create feature branch: `git checkout -b feature/driver-portal-xyz`
2. Follow mobile-first approach
3. Test on multiple devices/browsers
4. Ensure theme support (dark/light)
5. Add tests if applicable
6. Update documentation
7. Submit PR with detailed description

## License

Same as parent project.
