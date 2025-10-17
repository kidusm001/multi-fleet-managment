// Utilities to normalize driver portal route timelines and statuses

const DRIVER_ACTIVATED_STATUSES = new Set(['IN_PROGRESS', 'ACTIVE']);
const COMPLETED_STATUSES = new Set(['COMPLETED', 'INACTIVE']);
const CANCELLED_STATUSES = new Set(['CANCELLED']);
const AUTO_ACTIVATION_WINDOW_MS = 2 * 60 * 60 * 1000; // two hours

const ensureDate = (value) => {
  if (!value) return null;
  const parsed = value instanceof Date ? value : new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const combineDateAndTime = (dateValue, timeValue) => {
  const datePart = ensureDate(dateValue);
  const timePart = ensureDate(timeValue);

  if (!datePart && !timePart) {
    return null;
  }

  if (datePart && !timePart) {
    return datePart;
  }

  if (!datePart && timePart) {
    return timePart;
  }

  const combined = new Date(datePart);
  combined.setHours(timePart.getHours(), timePart.getMinutes(), timePart.getSeconds(), timePart.getMilliseconds());
  return combined;
};

export const getRouteStartTime = (route) => {
  if (!route) return null;
  return (
    ensureDate(route.startedAt) ||
    ensureDate(route.startTime) ||
    combineDateAndTime(route.date, route.shift?.startTime) ||
    ensureDate(route.shift?.startTime) ||
    ensureDate(route.date)
  );
};

export const getRouteEndTime = (route) => {
  if (!route) return null;
  return (
    ensureDate(route.completedAt) ||
    ensureDate(route.endTime) ||
    combineDateAndTime(route.date, route.shift?.endTime) ||
    ensureDate(route.shift?.endTime)
  );
};

export const getEffectiveRouteStatus = (route, now = new Date()) => {
  if (!route) return 'PENDING';

  const status = typeof route.status === 'string' ? route.status.toUpperCase() : '';
  const start = getRouteStartTime(route);
  const end = getRouteEndTime(route);
  const driverActivated = DRIVER_ACTIVATED_STATUSES.has(status) || Boolean(route.startedAt);

  if (CANCELLED_STATUSES.has(status)) {
    return 'CANCELLED';
  }

  if (COMPLETED_STATUSES.has(status)) {
    return 'COMPLETED';
  }

  if (driverActivated) {
    if (end && end <= now) {
      return 'COMPLETED';
    }
    return 'IN_PROGRESS';
  }

  if (end && end <= now) {
    return 'COMPLETED';
  }

  if (!start) {
    return 'PENDING';
  }

  if (now < start) {
    return 'PENDING';
  }

  const autoWindowEnd = new Date(start.getTime() + AUTO_ACTIVATION_WINDOW_MS);
  if (now <= autoWindowEnd) {
    return 'IN_PROGRESS';
  }

  return 'COMPLETED';
};

export const withEffectiveStatus = (route, now = new Date()) => ({
  ...route,
  effectiveStatus: getEffectiveRouteStatus(route, now),
});

export const groupRoutesByEffectiveStatus = (routes = [], now = new Date()) => {
  return routes.reduce((acc, route) => {
    const enriched = withEffectiveStatus(route, now);
    const status = enriched.effectiveStatus;
    if (!acc[status]) {
      acc[status] = [];
    }
    acc[status].push(enriched);
    return acc;
  }, {});
};

export const sortRoutesByStartTime = (routes = []) => {
  return [...routes].sort((a, b) => {
    const aStart = getRouteStartTime(a);
    const bStart = getRouteStartTime(b);

    if (!aStart && !bStart) return 0;
    if (!aStart) return 1;
    if (!bStart) return -1;
    return aStart.getTime() - bStart.getTime();
  });
};

export const sortRoutesByEndTime = (routes = []) => {
  return [...routes].sort((a, b) => {
    const aEnd = getRouteEndTime(a);
    const bEnd = getRouteEndTime(b);

    if (!aEnd && !bEnd) return 0;
    if (!aEnd) return 1;
    if (!bEnd) return -1;
    return aEnd.getTime() - bEnd.getTime();
  });
};

export const findNextUpcomingRoute = (routes = [], now = new Date()) => {
  const upcoming = sortRoutesByStartTime(routes);
  return upcoming.find((route) => {
    const start = getRouteStartTime(route);
    if (!start) return false;
    return start.getTime() >= now.getTime();
  }) || null;
};
