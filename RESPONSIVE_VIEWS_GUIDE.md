# Responsive Dashboard Views - Visual Guide

## 📱 Mobile View (< 640px)
```
┌─────────────────────┐
│  [App Header]       │
├─────────────────────┤
│                     │
│   [Stats Overlay]   │
│                     │
│  ┌───────────────┐  │
│  │               │  │
│  │     Map       │  │
│  │   (75% H)     │  │
│  │               │  │
│  └───────────────┘  │
│                     │
│  [Search/Filter]    │
│  ┌───────────────┐  │
│  │ Route List    │  │
│  │ (5 routes)    │  │
│  │ [Scrollable]  │  │
│  └───────────────┘  │
│                     │
│  [Route Details]    │  <- Floating button opens modal
├─────────────────────┤
│    [Footer]         │
└─────────────────────┘

Modal (Bottom Sheet):
┌─────────────────────┐
│   [Backdrop 50%]    │
│                     │
│  ╔═════════════════╗│
│  ║ ─── Handle ───  ║│
│  ║                 ║│
│  ║ Route: North    ║│
│  ║ Status: Active  ║│
│  ║                 ║│
│  ║ [Quick Stats]   ║│
│  ║ Stops | Pax     ║│
│  ║                 ║│
│  ║ [Toggle Status] ║│
│  ║                 ║│
│  ║ Drop-off Points ║│
│  ║ • Stop 1        ║│
│  ║ • Stop 2        ║│
│  ║ [Scrollable]    ║│
│  ╚═════════════════╝│
└─────────────────────┘
```

## 📲 Tablet View (640px - 1024px)
```
┌─────────────────────────────────────────────────┐
│           [App Header]                          │
├─────────────────────────────────────────────────┤
│                                                 │
│        [Stats Cards - Centered]                 │
│                                                 │
│  ┌──────┐  ┌──────────────────┐  ┌──────────┐  │
│  │Search│  │                  │  │          │  │
│  │Filter│  │                  │  │  Route   │  │
│  ├──────┤  │    Full Map      │  │ Details  │  │
│  │      │  │                  │  │  Panel   │  │
│  │Route │  │   (100% H)       │  │          │  │
│  │List  │  │                  │  │[Expand/  │  │
│  │      │  │                  │  │Collapse] │  │
│  │[...]│  │                  │  │          │  │
│  └──────┘  └──────────────────┘  └──────────┘  │
│  w: 288px        Center              w: 384px  │
│                                                 │
├─────────────────────────────────────────────────┤
│                  [Footer]                       │
└─────────────────────────────────────────────────┘
```

## 🖥️ Desktop View (≥ 1024px)
```
┌───────────────────────────────────────────────────────┐
│                [App Header]                           │
├───────────────────────────────────────────────────────┤
│                                                       │
│              [Stats Cards - Centered]                 │
│                                                       │
│  ┌────────────┐  ┌──────────────────┐  ┌──────────┐  │
│  │   Search   │  │                  │  │          │  │
│  │   Filter   │  │                  │  │  Route   │  │
│  ├────────────┤  │    Full Map      │  │ Details  │  │
│  │            │  │                  │  │  Panel   │  │
│  │   Route    │  │   (100% H)       │  │          │  │
│  │   List     │  │                  │  │[Expand/  │  │
│  │            │  │                  │  │Collapse] │  │
│  │  [Scroll]  │  │                  │  │          │  │
│  │            │  │                  │  │          │  │
│  └────────────┘  └──────────────────┘  └──────────┘  │
│    w: 320px            Center              w: 384px  │
│                                                       │
├───────────────────────────────────────────────────────┤
│                    [Footer]                           │
└───────────────────────────────────────────────────────┘
```

---

## 🚗 Driver Portal - Mobile
```
┌─────────────────────┐
│  Logo | Driver | 🔔 │ <- Top Bar
├─────────────────────┤
│                     │
│   [Dashboard View]  │
│                     │
│   • Greeting        │
│   • Active Route    │
│   • Quick Stats     │
│   • Upcoming Shifts │
│                     │
│                     │
├─────────────────────┤
│ 🏠 🚚 📅 👤        │ <- Bottom Nav
└─────────────────────┘
```

## 🚗 Driver Portal - Tablet
```
┌─────────────────────────────┐
│  Logo (L) | Driver | 🔔     │ <- Larger Top Bar
├─────────────────────────────┤
│                             │
│    [Dashboard View]         │
│                             │
│    • Greeting (larger)      │
│    • Active Route Card      │
│    • Quick Stats Grid       │
│    • Upcoming Shifts        │
│                             │
│    [More Padding: px-6]     │
│                             │
├─────────────────────────────┤
│  🏠   🚚   📅   👤          │ <- Wider Bottom Nav
└─────────────────────────────┘
    (Larger icons & text)
```

---

## Key Differences Summary

### Mobile (< 640px):
- **Layout**: Vertical stack, 75% map, route list below
- **Navigation**: Bottom sheet modal for route details
- **Padding**: Compact (px-4)
- **Touch**: 44x44px minimum tap targets

### Tablet (640px - 1024px):
- **Layout**: Horizontal split, full map with sidebars
- **Navigation**: Collapsible right panel for route details
- **Padding**: Comfortable (px-6 for Driver Portal)
- **Touch**: Larger icons and text (20-30% increase)
- **Sidebar**: Compact left (288px) vs desktop (320px)

### Desktop (≥ 1024px):
- **Layout**: Full sidebars, maximum map visibility
- **Navigation**: Permanent panels with hover effects
- **Padding**: Spacious
- **Mouse**: Hover states, smaller click targets acceptable

---

## Viewport Detection Logic

```javascript
// useViewport.js
const checkViewport = () => {
  const width = window.innerWidth;
  
  if (width < 640) {
    return 'mobile';        // 📱 Phones
  } else if (width < 1024) {
    return 'tablet';        // 📲 Tablets, Car displays
  } else {
    return 'desktop';       // 🖥️ Computers
  }
};
```

---

## Component Routing

### Main Dashboard:
```javascript
function Dashboard() {
  const viewport = useViewport();
  
  if (viewport === 'mobile')  return <MobileDashboardView />;
  if (viewport === 'tablet')  return <TabletDashboardView />;
  return <DashboardDesktop />;
}
```

### Driver Portal:
```javascript
function DriverPortal() {
  const viewport = useViewport();
  const tabletMode = viewport === 'tablet';
  
  return <MobileDriverPortal tabletMode={tabletMode}>
    {/* All views get tablet enhancements */}
  </MobileDriverPortal>;
}
```

---

## CSS Class Examples

### Mobile:
```css
className="px-4 h-14 text-sm"
```

### Tablet (Conditional):
```css
className={cn(
  "px-4 h-14 text-sm",
  tabletMode && "px-6 h-16 text-base"
)}
```

### Responsive (Tailwind):
```css
className="px-4 md:px-6 lg:px-8
           text-sm md:text-base lg:text-lg
           w-full md:w-72 lg:w-80"
```

---

## Use Cases by Device

### 📱 Mobile Phones:
- **View**: MobileDashboardView
- **Best For**: On-the-go monitoring, quick checks
- **Features**: Bottom sheet modal, vertical layout

### 📲 Tablets (7-10"):
- **View**: TabletDashboardView
- **Best For**: Car infotainment, mounted tablets
- **Features**: Full map, compact sidebars, landscape optimized

### 🖥️ Desktop:
- **View**: DashboardDesktop
- **Best For**: Office management, detailed analysis
- **Features**: Full sidebars, mouse interactions

### 🚗 Car Displays:
- **View**: TabletDashboardView (Driver Portal with tablet mode)
- **Best For**: In-vehicle navigation and monitoring
- **Features**: Large touch targets, high contrast, glanceable info

---

## Testing Devices

### Mobile Testing:
- iPhone 13 (390x844)
- Samsung Galaxy S21 (360x800)
- Pixel 6 (412x915)

### Tablet Testing:
- iPad Mini (768x1024)
- Samsung Tab S7 (800x1280)
- Car infotainment (typically 800x480 to 1024x600)

### Desktop Testing:
- MacBook Pro (1440x900)
- 1080p Display (1920x1080)
- 4K Display (3840x2160)

---

## Performance Considerations

1. **Lazy Loading**: Map component loads on-demand
2. **Memoization**: Route transformations cached
3. **Conditional Rendering**: Only load needed components per viewport
4. **CSS Optimization**: Tailwind purges unused classes
5. **Animation**: Framer Motion with GPU acceleration
