export const MAP_CONFIG = {
  HQ_LOCATION: {
  name: import.meta.env.VITE_HQ_NAME || "Routegna (HQ)",
    coords: [
      parseFloat(import.meta.env.VITE_HQ_LONGITUDE),
      parseFloat(import.meta.env.VITE_HQ_LATITUDE)
    ]
  },
  darkStyle: import.meta.env.VITE_MAPBOX_DARK_STYLE,
  lightStyle: import.meta.env.VITE_MAPBOX_LIGHT_STYLE
};

export const MAPBOX_ACCESS_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

export const ROLES = {
  SUPERADMIN: 'superadmin',
  OWNER: 'owner',
  ADMIN: 'admin',
  MANAGER: 'manager',
  DRIVER: 'driver',
  EMPLOYEE: 'employee'
};

export const ROLE_LABELS = {
  [ROLES.SUPERADMIN]: 'Super Admin',
  [ROLES.OWNER]: 'Owner',
  [ROLES.ADMIN]: 'Administrator',
  [ROLES.MANAGER]: 'Fleet Manager',
  [ROLES.DRIVER]: 'Driver',
  [ROLES.EMPLOYEE]: 'Employee'
};

export const ROUTES = {
  HOME: '/',
  DASHBOARD: '/dashboard',
  ROUTES: '/routes',
  VEHICLES: '/vehicles',
  SHUTTLES: '/shuttles', // Legacy compatibility
  EMPLOYEES: '/employees',
  DRIVERS: '/driver-management',
  PAYROLL: '/payroll',
  ATTENDANCE: '/attendance',
  ORGANIZATIONS: '/organizations',
  ORGANIZATION_MANAGEMENT: '/organization-management',
  NOTIFICATIONS: '/notifications',
  SETTINGS: '/settings',
  DRIVER_PORTAL: '/driver',
  PROFILE: '/profile'
};

export const SHUTTLE_ROUTES = [
  {
    id: 'route-1',
    name: 'Route A',
    stops: ['Bole', 'Sarbet', 'Kazanchis'],
    capacity: 30
  },
  {
    id: 'route-2',
    name: 'Route B',
    stops: ['Gerji', 'CMC', 'Megenagna'],
    capacity: 25
  },
  {
    id: 'route-3',
    name: 'Route C',
    stops: ['CMC', 'Bole', 'Megenagna'],
    capacity: 28
  },
  {
    id: 'route-4',
    name: 'Route D',
    stops: ['Sarbet', 'Kazanchis', 'Gerji'],
    capacity: 22
  }
];