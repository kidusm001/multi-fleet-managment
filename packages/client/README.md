# MMCY Tech Shuttle Management System - Frontend

<div align="center">
<h3>Enterprise Transportation Management UI</h3>
<p>Developed by MMCY Tech Internship Team | Addis Ababa, Ethiopia</p>
</div>

## Table of Contents

1. [Overview](#overview)
2. [Technology Stack](#technology-stack)
3. [Project Structure](#project-structure)
4. [Main Components](#main-components)
5. [State Management](#state-management)
6. [Key Features](#key-features)
7. [Map Integration](#map-integration)
8. [Installation](#installation)
9. [Contributors](#contributors)

---

## Overview

The frontend of the Shuttle Management System provides an intuitive and responsive user interface for MMCY Tech's employee transportation management solution. It offers comprehensive tools for managing routes, shuttles, employees, and drivers while featuring role-based access control, interactive maps, and real-time optimization.

### Technology Stack

- **Frontend Framework**: React with React Router for navigation
- **UI Styling**: Tailwind CSS and shadcn/ui components
- **API Integration**: Axios-based modular services
- **State Management**: React Context API
- **Map Visualization**: Mapbox GL JS
- **Data Visualization**: Chart.js / Recharts
- **Animation**: Framer Motion

---

## Project Structure

```
frontend/
├── src/
│   ├── App.jsx                # Main application logic and routing
│   ├── main.jsx               # Root entry point
│   ├── pages/                 # Application pages
│   │   ├── Home/              # Landing page
│   │   │   ├── index.jsx      # Main component
│   │   │   ├── Features.jsx   # Features section
│   │   │   └── Hero.jsx       # Hero section with animations
│   │   │
│   │   ├── Dashboard/         # Dashboard view
│   │   │   ├── index.jsx      # Main component
│   │   │   ├── Stats.jsx      # Statistics display
│   │   │   ├── RecentRoutes/  # Recent routes components
│   │   │   │   ├── index.jsx  # Container component
│   │   │   │   └── RouteCard.jsx # Individual route card
│   │   │   └── Charts/        # Dashboard charts
│   │   │       ├── RoutesChart.jsx
│   │   │       └── MapOverview.jsx
│   │   │
│   │   ├── Auth/              # Authentication pages
│   │   │   ├── Login.jsx      # Login page
│   │   │   ├── Register.jsx   # Registration page
│   │   │   └── ForgotPassword.jsx # Password recovery
│   │   │
│   │   ├── RouteManagement/   # Route management pages
│   │   │   ├── index.jsx      # Routes list view
│   │   │   ├── CreateRoute.jsx # Route creation form
│   │   │   ├── EditRoute.jsx  # Route editing form
│   │   │   ├── RouteDetails.jsx # Detailed route view
│   │   │   └── components/    # Route-specific components
│   │   │       ├── RouteTable.jsx
│   │   │       ├── RouteMap.jsx
│   │   │       ├── StopList.jsx
│   │   │       └── AssignmentModal.jsx
│   │   │
│   │   ├── ShuttleManagement/ # Shuttle management pages
│   │   │   ├── index.jsx      # Shuttles list view
│   │   │   ├── ShuttleDetails.jsx # Detailed shuttle view
│   │   │   ├── MaintenanceSchedule.jsx # Maintenance view
│   │   │   └── components/    # Shuttle-specific components
│   │   │       ├── ShuttleTable.jsx
│   │   │       ├── ShuttleForm.jsx
│   │   │       └── StatusBadge.jsx
│   │   │
│   │   ├── EmployeeManagement/ # Employee management pages
│   │   │   ├── index.jsx      # Employees list view
│   │   │   ├── EmployeeDetails.jsx # Detailed employee view
│   │   │   ├── LocationApproval.jsx # Location approval page
│   │   │   └── components/    # Employee-specific components
│   │   │       ├── EmployeeTable.jsx
│   │   │       ├── EmployeeForm.jsx
│   │   │       ├── LocationMap.jsx
│   │   │       └── TableActions.jsx
│   │   │
│   │   ├── Settings/          # Settings pages
│   │   │   ├── index.jsx      # Main settings page
│   │   │   ├── AccountSettings.jsx # Account settings
│   │   │   ├── AppSettings.jsx # Application settings
│   │   │   └── NotificationSettings.jsx # Notification settings
│   │   │
│   │   └── NotFound.jsx       # 404 page
│   │
│   ├── components/
│   │   ├── Common/            # Reusable UI components
│   │   │   ├── Layout/        # Layout components
│   │   │   │   ├── TopBar/    # Top navigation bar
│   │   │   │   │   ├── index.jsx
│   │   │   │   │   ├── SearchBar.jsx
│   │   │   │   │   ├── UserMenu.jsx
│   │   │   │   │   └── ThemeToggle.jsx
│   │   │   │   │
│   │   │   │   ├── Sidebar/   # Side navigation
│   │   │   │   │   ├── index.jsx
│   │   │   │   │   ├── SidebarItem.jsx
│   │   │   │   │   └── SidebarFooter.jsx
│   │   │   │   │
│   │   │   │   ├── Footer/    # Footer component
│   │   │   │   │   └── index.jsx
│   │   │   │   │
│   │   │   │   └── PageLayout.jsx # Combines layout components
│   │   │   │
│   │   │   └── UI/            # UI components
│   │   │       ├── Button/    # Button components
│   │   │       │   └── index.jsx
│   │   │       ├── Input/     # Input components
│   │   │       │   └── index.jsx
│   │   │       ├── Select/    # Select components
│   │   │       │   ├── index.jsx
│   │   │       │   └── SelectItem.jsx
│   │   │       ├── Badge/     # Badge components
│   │   │       │   └── index.jsx
│   │   │       ├── Card/      # Card components
│   │   │       │   ├── index.jsx
│   │   │       │   ├── CardHeader.jsx
│   │   │       │   ├── CardContent.jsx
│   │   │       │   └── CardFooter.jsx
│   │   │       ├── Dialog/    # Dialog components
│   │   │       │   ├── index.jsx
│   │   │       │   ├── DialogHeader.jsx
│   │   │       │   └── DialogFooter.jsx
│   │   │       ├── Table/     # Table components
│   │   │       │   ├── index.jsx
│   │   │       │   ├── TableHeader.jsx
│   │   │       │   └── TableRow.jsx
│   │   │       ├── Tabs/      # Tab components
│   │   │       │   ├── index.jsx
│   │   │       │   └── TabsContent.jsx
│   │   │       ├── Toast/     # Toast notifications
│   │   │       │   └── index.jsx
│   │   │       ├── Dropdown/  # Dropdown menus
│   │   │       │   └── index.jsx
│   │   │       ├── Loader/    # Loading indicators
│   │   │       │   └── index.jsx
│   │   │       ├── EmptyState/ # Empty state displays
│   │   │       │   └── index.jsx
│   │   │       └── Map/       # Map components
│   │   │           ├── index.jsx
│   │   │           ├── MapMarker.jsx
│   │   │           └── RouteLayer.jsx
│   │   │
│   │   ├── Shuttle/           # Shuttle-specific components
│   │   │   ├── ShuttleCard.jsx  # Shuttle card component
│   │   │   ├── ShuttleStats.jsx # Shuttle statistics
│   │   │   └── AvailabilityCalendar.jsx # Availability display
│   │   │
│   │   ├── Route/             # Route-specific components
│   │   │   ├── RouteCard.jsx  # Route card component
│   │   │   ├── RouteTimeline.jsx # Route timeline display
│   │   │   ├── RouteSummary.jsx # Route summary display
│   │   │   └── OptimizationPanel.jsx # Optimization controls
│   │   │
│   │   └── Employee/          # Employee-specific components
│   │       ├── EmployeeCard.jsx # Employee card component
│   │       ├── LocationEditor.jsx # Location editing
│   │       └── AssignmentPanel.jsx # Assignment controls
│   │
│   ├── contexts/              # Context providers
│   │   ├── AuthContext.jsx    # Authentication state
│   │   ├── ThemeContext.jsx   # Theme preferences
│   │   ├── RoleContext.jsx    # User role management
│   │   ├── SidebarContext.jsx # Sidebar state 
│   │   ├── NotificationContext.jsx # Notification state
│   │   └── SearchContext.jsx  # Global search state
│   │
│   ├── services/              # API and utility functions
│   │   ├── api.js             # Base API configuration
│   │   ├── authService.js     # Authentication service
│   │   ├── employeeService.js # Employee data service
│   │   ├── routeService.js    # Route data service
│   │   ├── shuttleService.js  # Shuttle data service
│   │   ├── clusterService.js  # Clustering service
│   │   └── mapService.js      # Map integration service
│   │
│   ├── hooks/                 # Custom React hooks
│   │   ├── useAuth.js         # Authentication hook
│   │   ├── useTheme.js        # Theme hook
│   │   ├── useRole.js         # Role management hook
│   │   ├── useMapBox.js       # Mapbox integration hook
│   │   └── useDebounce.js     # Debounce utility hook
│   │
│   ├── utils/                 # Utility functions
│   │   ├── formatters.js      # Data formatting utilities
│   │   ├── validators.js      # Form validation helpers
│   │   ├── mapHelpers.js      # Map utility functions
│   │   └── dateHelpers.js     # Date manipulation helpers
│   │
│   ├── styles/                # Global styles
│   │   ├── index.css          # Main stylesheet
│   │   ├── tailwind.css       # Tailwind imports
│   │   └── animations.css     # Custom animations
│   │
│   └── assets/                # Static assets
│       ├── images/            # Image assets
│       │   ├── logo.svg       # Company logo
│       │   ├── map-markers/   # Map marker icons
│       │   └── illustrations/ # UI illustrations
│       ├── icons/             # Icon assets
│       └── fonts/             # Font files
│
├── public/                    # Public files
│   ├── index.html             # HTML entry point
│   ├── favicon.ico            # Site favicon
│   ├── manifest.json          # PWA manifest
│   └── assets/                # Static public assets
│
├── config/                    # Configuration files
│   ├── webpack.config.js      # Webpack configuration
│   └── jest.config.js         # Jest testing configuration
│
├── tests/                     # Test files
│   ├── unit/                  # Unit tests
│   ├── integration/           # Integration tests
│   └── e2e/                   # End-to-end tests
│
├── .env.example               # Environment variables example
├── package.json               # Dependencies and scripts
├── tailwind.config.js         # Tailwind CSS configuration
├── tsconfig.json              # TypeScript configuration
└── vite.config.js             # Vite configuration
```

---

## Main Components

### Layout Components

- **TopBar**: Navigation header with role selection, search, and theme toggle
- **Sidebar**: Collapsible navigation menu
- **Footer**: Contact information and quick links

### Common UI Components

- **Button**: Reusable button with multiple variants
- **Input**: Form input component
- **Select**: Custom dropdown component
- **Badge**: Status indicators
- **Card**: Container for content blocks
- **Dialog**: Modal component for forms and confirmations
- **Map**: Interactive map component

---

## State Management

The application uses React Context API for global state management:

1. **AuthContext**: Manages authentication state and user data
2. **ThemeContext**: Controls light/dark mode theming
3. **RoleContext**: Handles user role-based feature access
4. **SidebarContext**: Controls sidebar visibility

---

## Key Features

### Dashboard

- Real-time statistics and metrics
- Route overview with animated expansions
- Theme-aware styling

### Route Management

- Route creation and editing
- Interactive stop management
- Employee assignment
- Shuttle selection

### Shuttle Management

- Shuttle tracking and status monitoring
- Capacity management
- Availability scheduling
- Maintenance tracking

### Employee Management

- Employee registration and profile management
- Location approval
- Route assignment
- Search and filtering
- Data export

---

## Map Integration

### Map Features
- **Interactive Map Display** using Mapbox GL JS
- **Dual-Mode Support**: Light and dark themes with custom styles
- **Real-time Route Visualization** with optimized paths
- **Dynamic Markers** for stops and headquarters
- **Custom Controls** for navigation and route management

### Route Optimization
- **Web Worker Implementation** for heavy computations
  - Route calculations performed off the main thread
  - Prevents UI blocking during complex operations
  - Handles large datasets efficiently

### Performance Optimizations
- **Lazy Loading**: Map components loaded on demand
- **Layer Management**: Efficient layer handling
- **Memory Management**: Proper cleanup and resource disposal
- **Caching**: Route data caching for improved performance

---

## Installation

```bash
# Clone the repository
git clone https://github.com/mmcytech/shuttle-management.git
cd shuttle-management/packages/frontend

# Install dependencies
pnpm install

# Create .env file (see .env.example for required variables)
cp .env.example .env

# Start development server
pnpm dev
```

### Required UI Components

Add the required shadcn/ui components:

```bash
# Install required dependencies
pnpm add @radix-ui/react-popover @radix-ui/react-scroll-area @radix-ui/react-badge framer-motion date-fns @radix-ui/react-select @radix-ui/react-tabs

# Add shadcn/ui components
pnpm dlx shadcn-ui@latest add popover
pnpm dlx shadcn-ui@latest add scroll-area
pnpm dlx shadcn-ui@latest add badge
pnpm dlx shadcn-ui@latest add button
pnpm dlx shadcn-ui@latest add select
pnpm dlx shadcn-ui@latest add tabs
pnpm dlx shadcn-ui@latest add card
```

---

## Contributors

This project was developed by interns at MMCY Tech:

- Leul Tewodros Agonafer
- Kidus Mesfin
- Yohannes Negash

Under the supervision of the MMCY Tech engineering team.

## License

Copyright © 2024 MMCY Tech. All rights reserved. 