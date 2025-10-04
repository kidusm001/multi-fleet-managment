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
  ADMIN: 'user',
  MANAGER: 'user'
};

export const ROLE_LABELS = {
  [ROLES.ADMIN]: 'Administrator',
  [ROLES.MANAGER]: 'Fleet Manager'
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
  ORGANIZATIONS: '/organizations',
  ORGANIZATION_MANAGEMENT: '/organization-management',
  NOTIFICATIONS: '/notifications',
  SETTINGS: '/settings'
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