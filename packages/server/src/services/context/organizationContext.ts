import { RouteStatus, VehicleStatus } from '@prisma/client';
import prisma from '../../db';

interface EntityCounts {
  employees: number;
  drivers: number;
  vehicles: number;
  routes: number;
  activeRoutes: number;
  inactiveRoutes: number;
}

interface DayBounds {
  startOfDay: Date;
  endOfDay: Date;
}

const MANAGEMENT_ROLES = new Set(['owner', 'admin', 'manager']);

export async function buildOrganizationContext(role: string, organizationId: string): Promise<string> {
  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    include: {
      _count: {
        select: {
          employees: true,
          drivers: true,
          vehicles: true,
          routes: true,
          members: true,
        },
      },
    },
  });

  if (!org) return 'Organization context currently unavailable.';

  const lines: string[] = [`Organization: ${org.name}`, `Members: ${org._count.members}`];

  if (MANAGEMENT_ROLES.has(role)) {
    const countLines = await buildEntityCountLines(organizationId);
    lines.push(...countLines);
  }

  if (role === 'owner' || role === 'admin') {
    const adminPulseLines = await buildAdminPulseLines(organizationId);
    lines.push(...adminPulseLines);
  }

  if (MANAGEMENT_ROLES.has(role)) {
    const now = new Date();
    const bounds = getDayBounds(now);

    const [
      routeStatusLines,
      driverStatusLines,
      vehicleStatusLines,
      todayRouteLines,
      attentionLines,
    ] = await Promise.all([
      buildRouteStatusSummaryLines(organizationId),
      buildDriverStatusLines(organizationId),
      buildVehicleStatusLines(organizationId),
      buildTodayRouteSummaryLines(organizationId, bounds),
      buildRoutesNeedingAttentionLines(organizationId, now, bounds),
    ]);

    lines.push(
      ...routeStatusLines,
      ...driverStatusLines,
      ...vehicleStatusLines,
      ...todayRouteLines,
      ...attentionLines,
    );
  }

  return lines.join('\n');
}

async function buildEntityCountLines(organizationId: string): Promise<string[]> {
  const counts = await getEntityCounts(organizationId);
  return [
    `Employees (active): ${counts.employees}`,
    `Drivers (active records): ${counts.drivers}`,
    `Vehicles (active records): ${counts.vehicles}`,
    `Routes (excluding deleted): ${counts.routes}`,
    `- ACTIVE routes: ${counts.activeRoutes}`,
    `- INACTIVE routes: ${counts.inactiveRoutes}`,
  ];
}

async function buildAdminPulseLines(organizationId: string): Promise<string[]> {
  const [recentNotifications, pendingRequests] = await Promise.all([
    prisma.notification.count({
      where: {
        organizationId,
        createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
    }),
    prisma.vehicleRequest.count({
      where: {
        organizationId,
        status: 'PENDING',
      },
    }),
  ]);

  return [
    `Recent Notifications (24h): ${recentNotifications}`,
    `Pending Vehicle Requests: ${pendingRequests}`,
  ];
}

async function buildRouteStatusSummaryLines(organizationId: string): Promise<string[]> {
  const routeStatus = await prisma.route.groupBy({
    by: ['status'],
    _count: { status: true },
    where: {
      organizationId,
      deleted: false,
    },
  });

  if (routeStatus.length === 0) {
    return [
      'Route Status Summary (all routes, excluding deleted):',
      '- No routes found for this organization.',
    ];
  }

  const totalRoutes = routeStatus.reduce((acc, row) => acc + row._count.status, 0);

  const lines = ['Route Status Summary (all routes, excluding deleted):'];
  for (const row of routeStatus) {
    lines.push(`- ${row.status}: ${row._count.status} route(s).`);
  }
  lines.push(`- Total active records: ${totalRoutes}.`);
  return lines;
}

async function buildDriverStatusLines(organizationId: string): Promise<string[]> {
  const [driverStatusCounts, driverAvailability] = await Promise.all([
    prisma.driver.groupBy({
      by: ['status'],
      _count: { status: true },
      where: {
        organizationId,
        deleted: false,
      },
    }),
    prisma.driver.count({
      where: {
        organizationId,
        deleted: false,
        isActive: true,
      },
    }),
  ]);

  if (driverStatusCounts.length === 0) {
    return [
      'Driver Status Breakdown:',
      '- No drivers found for this organization.',
    ];
  }

  const lines = ['Driver Status Breakdown:'];
  for (const row of driverStatusCounts) {
    lines.push(`- ${row.status}: ${row._count.status} driver(s).`);
  }
  lines.push(`- Active driver flag (isActive=true): ${driverAvailability}.`);
  return lines;
}

async function buildVehicleStatusLines(organizationId: string): Promise<string[]> {
  const [vehicleStatusCounts, vehiclesAvailable, vehiclesInUse] = await Promise.all([
    prisma.vehicle.groupBy({
      by: ['status'],
      _count: { status: true },
      where: {
        organizationId,
        deleted: false,
      },
    }),
    prisma.vehicle.count({
      where: {
        organizationId,
        deleted: false,
        status: 'AVAILABLE',
      },
    }),
    prisma.vehicle.count({
      where: {
        organizationId,
        deleted: false,
        status: VehicleStatus.IN_USE,
      },
    }),
  ]);

  if (vehicleStatusCounts.length === 0) {
    return [
      'Vehicle Status Breakdown:',
      '- No vehicles found.',
    ];
  }

  const lines = ['Vehicle Status Breakdown:'];
  for (const row of vehicleStatusCounts) {
    lines.push(`- ${row.status}: ${row._count.status} vehicle(s).`);
  }
  lines.push(`- Vehicles marked AVAILABLE: ${vehiclesAvailable}.`);
  lines.push(`- Vehicles currently in use (status=IN_USE): ${vehiclesInUse}.`);
  return lines;
}

async function buildTodayRouteSummaryLines(organizationId: string, bounds: DayBounds): Promise<string[]> {
  const [routeStatusCounts, routesInProgress] = await Promise.all([
    prisma.route.groupBy({
      by: ['status'],
      _count: { status: true },
      where: {
        organizationId,
        deleted: false,
        date: { gte: bounds.startOfDay, lte: bounds.endOfDay },
      },
    }),
    prisma.route.count({
      where: {
        organizationId,
        deleted: false,
        status: RouteStatus.IN_PROGRESS,
        date: { gte: bounds.startOfDay, lte: bounds.endOfDay },
      },
    }),
  ]);

  if (routeStatusCounts.length === 0) {
    return [
      "Today's Route Status Breakdown:",
      '- No routes scheduled for today.',
    ];
  }

  const lines = ["Today's Route Status Breakdown:"];
  for (const row of routeStatusCounts) {
    lines.push(`- ${row.status}: ${row._count.status} route(s).`);
  }
  lines.push(`- Routes currently IN_PROGRESS: ${routesInProgress}.`);
  return lines;
}

async function buildRoutesNeedingAttentionLines(
  organizationId: string,
  now: Date,
  bounds: DayBounds,
): Promise<string[]> {
  const routes = await prisma.route.findMany({
    where: {
      organizationId,
      deleted: false,
      AND: [
        {
          OR: [
            { date: { gte: bounds.startOfDay, lte: bounds.endOfDay } },
            { startTime: { gte: bounds.startOfDay, lte: bounds.endOfDay } },
          ],
        },
        {
          OR: [
            { status: { in: [RouteStatus.PENDING, RouteStatus.CANCELLED, RouteStatus.INACTIVE] } },
            { vehicleId: null },
            { vehicle: { is: { driverId: null } } },
            { stops: { some: { estimatedArrivalTime: { lt: now }, completedAt: null } } },
          ],
        },
      ],
    },
    select: {
      id: true,
      name: true,
      status: true,
      vehicleId: true,
      vehicle: {
        select: {
          id: true,
          plateNumber: true,
          driver: {
            select: {
              id: true,
              name: true,
              status: true,
            },
          },
        },
      },
      shift: {
        select: {
          name: true,
          startTime: true,
        },
      },
      startTime: true,
      endTime: true,
      date: true,
      stops: {
        orderBy: { order: 'asc' },
        select: {
          id: true,
          name: true,
          estimatedArrivalTime: true,
          completedAt: true,
        },
      },
    },
    orderBy: [
      { startTime: 'asc' },
      { name: 'asc' },
    ],
    take: 5,
  });

  if (routes.length === 0) {
    return [
      'Routes Needing Attention (today):',
      '- None identified from system data in the last 24 hours.',
      '- Ask the user for route IDs if they know of new issues.',
    ];
  }

  const lines = ['Routes Needing Attention (today):'];

  for (const route of routes) {
    const issues: string[] = [];
    const actions: string[] = [];

    if (route.status === RouteStatus.PENDING) {
      issues.push('pending dispatch');
      actions.push('Confirm readiness and mark In Progress when the vehicle departs');
    }
    if (route.status === RouteStatus.CANCELLED) {
      issues.push('marked as cancelled');
      actions.push('Notify affected riders and offer alternate transport');
    }
    if (route.status === RouteStatus.INACTIVE) {
      issues.push('inactive status');
      actions.push('Reactivate the route or archive it if no longer needed');
    }

    if (!route.vehicleId) {
      issues.push('no vehicle assigned');
      actions.push('Assign an available vehicle immediately');
    }

    if (route.vehicleId && !route.vehicle?.driver) {
      issues.push('vehicle missing driver assignment');
      actions.push(
        route.vehicle?.plateNumber
          ? `Assign a driver to vehicle ${route.vehicle.plateNumber}`
          : 'Assign a driver to the selected vehicle',
      );
    }

    const incompleteStops = route.stops.filter((stop) => !stop.completedAt);
    const overdueStops = incompleteStops.filter((stop) => {
      return Boolean(stop.estimatedArrivalTime && stop.estimatedArrivalTime < now);
    });

    if (overdueStops.length > 0) {
      issues.push(`${overdueStops.length} stop(s) overdue`);
      actions.push('Call the assigned driver and notify waiting riders about the delay');
    }

    if (actions.length === 0) {
      actions.push('Monitor progress and confirm stop completion updates');
    }

    const shiftLabel = route.shift?.name ? `shift ${route.shift.name}` : 'no shift';
    const incompleteStop = incompleteStops[0];
    const nextStopLabel = incompleteStop
      ? `Next stop ${incompleteStop.name ?? incompleteStop.id}`
      : 'All scheduled stops completed';
    const startLabel = route.startTime
      ? `starts ${route.startTime.toISOString()}`
      : route.date
        ? `scheduled ${route.date.toISOString()}`
        : 'start time not scheduled';

    const descriptor = route.name || route.id;
    const issueSummary = issues.join('; ') || 'monitoring';
    const actionSummary = actions.join(' / ');

    lines.push(
      `- ${descriptor}: ${issueSummary} | ${startLabel} | ${shiftLabel} | ${nextStopLabel}. Recommended: ${actionSummary}`,
    );
  }

  return lines;
}

async function getEntityCounts(organizationId: string): Promise<EntityCounts> {
  const [
    employees,
    drivers,
    vehicles,
    routes,
    activeRoutes,
    inactiveRoutes,
  ] = await Promise.all([
    prisma.employee.count({ where: { organizationId, deleted: false } }),
    prisma.driver.count({ where: { organizationId, deleted: false } }),
    prisma.vehicle.count({ where: { organizationId, deleted: false } }),
    prisma.route.count({ where: { organizationId, deleted: false } }),
    prisma.route.count({
      where: {
        organizationId,
        deleted: false,
        status: RouteStatus.ACTIVE,
      },
    }),
    prisma.route.count({
      where: {
        organizationId,
        deleted: false,
        status: RouteStatus.INACTIVE,
      },
    }),
  ]);

  return {
    employees,
    drivers,
    vehicles,
    routes,
    activeRoutes,
    inactiveRoutes,
  };
}

function getDayBounds(now: Date): DayBounds {
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(now);
  endOfDay.setHours(23, 59, 59, 999);
  return { startOfDay, endOfDay };
}
