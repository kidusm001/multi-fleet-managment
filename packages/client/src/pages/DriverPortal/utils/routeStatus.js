// Utilities to normalize driver portal route timelines and statuses

const DRIVER_ACTIVATED_STATUSES = new Set(['ACTIVE', 'IN_PROGRESS']);
const COMPLETED_STATUSES = new Set(['COMPLETED', 'INACTIVE']);
const CANCELLED_STATUSES = new Set(['CANCELLED']);
const AUTO_ACTIVATION_WINDOW_MS = 2 * 60 * 60 * 1000; // two hours

const ensureDate = (value) => {
  if (!value) return null;
  const parsed = value instanceof Date ? value : new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const startOfDay = (input) => {
  const base = ensureDate(input || new Date());
  if (!base) return null;
  const date = new Date(base);
  date.setHours(0, 0, 0, 0);
  return date;
};

const endOfDay = (input) => {
  const base = ensureDate(input || new Date());
  if (!base) return null;
  const date = new Date(base);
  date.setHours(23, 59, 59, 999);
  return date;
};

const addDays = (input, days) => {
  const base = ensureDate(input || new Date());
  if (!base) return null;
  const date = new Date(base);
  date.setDate(date.getDate() + days);
  return date;
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

export const isVirtualRoute = (route) => {
  if (!route) return false;
  if (route.isVirtual) return true;
  const identifier = typeof route.id === 'string' ? route.id : '';
  return identifier.startsWith('virtual-');
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

export const getRouteDateParts = (route) => {
  const start = getRouteStartTime(route) || ensureDate(route?.date);
  if (!start) {
    return {
      weekday: null,
      dateLabel: null,
      fullLabel: null,
    };
  }

  const weekday = typeof route?.weekdayName === 'string' && route.weekdayName.trim()
    ? route.weekdayName.trim()
    : start.toLocaleDateString('en-US', { weekday: 'long' });

  const dateLabel = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  return {
    weekday,
    dateLabel,
    fullLabel: `${weekday}, ${dateLabel}`,
  };
};

export const getEffectiveRouteStatus = (route, now = new Date()) => {
  if (!route) return 'UPCOMING';

  // Use driverStatus from server if available
  const driverStatus = typeof route.driverStatus === 'string' ? route.driverStatus.toUpperCase() : '';
  if (driverStatus === 'UPCOMING' || driverStatus === 'ACTIVE' || driverStatus === 'COMPLETED' || driverStatus === 'CANCELLED') {
    return driverStatus;
  }

  // Fallback client-side logic (shouldn't be needed with server driverStatus)
  const statusRaw = typeof route.status === 'string' ? route.status.toUpperCase() : '';
  const status = statusRaw === 'IN_PROGRESS' ? 'ACTIVE' : statusRaw;
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
    return 'ACTIVE';
  }

  if (end && end <= now) {
    return 'COMPLETED';
  }

  if (!start) {
    return 'UPCOMING';
  }

  if (now < start) {
    return 'UPCOMING';
  }

  const autoWindowEnd = new Date(start.getTime() + AUTO_ACTIVATION_WINDOW_MS);
  if (now <= autoWindowEnd) {
    return 'ACTIVE';
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

export const filterUpcomingDisplayWindow = (routes = [], now = new Date()) => {
  const windowStart = startOfDay(now);
  const windowEnd = endOfDay(addDays(now, 1));

  if (!windowStart || !windowEnd) {
    return routes;
  }

  return routes.filter((route) => {
    const start = getRouteStartTime(route) || ensureDate(route?.date);
    if (!start) return false;
    return start >= windowStart && start <= windowEnd;
  });
};

export const filterRecentCompletedWindow = (routes = [], now = new Date()) => {
  const windowStart = startOfDay(addDays(now, -1));
  const windowEnd = endOfDay(now);

  if (!windowStart || !windowEnd) {
    return routes;
  }

  return routes.filter((route) => {
    const end = getRouteEndTime(route) || getRouteStartTime(route) || ensureDate(route?.date);
    if (!end) return false;
    return end >= windowStart && end <= windowEnd;
  });
};

export const findNextUpcomingRoute = (routes = [], now = new Date()) => {
  const upcoming = sortRoutesByStartTime(routes);
  const nextRealRoute = upcoming.find((route) => {
    if (isVirtualRoute(route)) {
      return false;
    }
    const start = getRouteStartTime(route);
    if (!start) return false;
    return start.getTime() >= now.getTime();
  });

  if (nextRealRoute) {
    return nextRealRoute;
  }

  return upcoming.find((route) => {
    const start = getRouteStartTime(route);
    if (!start) return false;
    return start.getTime() >= now.getTime();
  }) || null;
};
