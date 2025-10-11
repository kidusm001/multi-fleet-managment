import { ROLES, ROUTES } from "@data/constants";

export type SubPath = {
  label: string;
  path: string;
};

export type NavItem = {
  label: string;
  path: string;
  subpaths?: SubPath[];
  roles?: string[]; // optional explicit allow-list
};

type RoleKey = string;

export const NAV_CONFIG: Record<RoleKey, NavItem[]> = {
  [ROLES.SUPERADMIN]: [
    { label: "Dashboard", path: ROUTES.DASHBOARD },
    {
      label: "Routes",
      path: ROUTES.ROUTES,
      subpaths: [
        { label: "Management", path: ROUTES.ROUTES },
        { label: "Assignment", path: `${ROUTES.ROUTES}?tab=assignment` },
        { label: "Create Route", path: `${ROUTES.ROUTES}?modal=create` },
      ],
    },
    { label: "Vehicles", path: ROUTES.VEHICLES },
    { label: "Employees", path: ROUTES.EMPLOYEES },
    { label: "Payroll", path: ROUTES.PAYROLL },
    { label: "Org Management", path: ROUTES.ORGANIZATION_MANAGEMENT },
    { label: "Settings", path: ROUTES.SETTINGS },
  ],
  [ROLES.OWNER]: [
    { label: "Dashboard", path: ROUTES.DASHBOARD },
    {
      label: "Routes",
      path: ROUTES.ROUTES,
      subpaths: [
        { label: "Management", path: ROUTES.ROUTES },
        { label: "Assignment", path: `${ROUTES.ROUTES}?tab=assignment` },
        { label: "Create Route", path: `${ROUTES.ROUTES}?modal=create` },
      ],
    },
    { label: "Vehicles", path: ROUTES.VEHICLES },
    { label: "Employees", path: ROUTES.EMPLOYEES },
    { label: "Payroll", path: ROUTES.PAYROLL },
    { label: "Org Management", path: ROUTES.ORGANIZATION_MANAGEMENT },
    { label: "Settings", path: ROUTES.SETTINGS },
  ],
  [ROLES.ADMIN]: [
    { label: "Dashboard", path: ROUTES.DASHBOARD },
    {
      label: "Routes",
      path: ROUTES.ROUTES,
      subpaths: [
        { label: "Management", path: ROUTES.ROUTES },
        { label: "Assignment", path: `${ROUTES.ROUTES}?tab=assignment` },
        { label: "Create Route", path: `${ROUTES.ROUTES}?modal=create` },
      ],
    },
    { label: "Vehicles", path: ROUTES.VEHICLES },
    { label: "Employees", path: ROUTES.EMPLOYEES },
    { label: "Payroll", path: ROUTES.PAYROLL },
    { label: "Org Management", path: ROUTES.ORGANIZATION_MANAGEMENT },
    { label: "Settings", path: ROUTES.SETTINGS },
  ],
  [ROLES.MANAGER]: [
    { label: "Dashboard", path: ROUTES.DASHBOARD },
    {
      label: "Routes",
      path: ROUTES.ROUTES,
      subpaths: [
        { label: "Management", path: ROUTES.ROUTES },
        { label: "Assignment", path: `${ROUTES.ROUTES}?tab=assignment` },
        { label: "Create Route", path: `${ROUTES.ROUTES}?modal=create` },
      ],
    },
    { label: "Vehicles", path: ROUTES.VEHICLES },
    { label: "Employees", path: ROUTES.EMPLOYEES },
  ],
  [ROLES.DRIVER]: [],
  [ROLES.EMPLOYEE]: [],
  // Fallback for unauth/unknown role
  default: [],
};
