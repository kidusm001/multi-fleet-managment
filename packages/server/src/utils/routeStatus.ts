export type DriverFacingStatus = 'UPCOMING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';

export type SchedulableRoute = {
  date?: Date | string | null;
  startTime?: Date | string | null;
  endTime?: Date | string | null;
  shift?: {
    startTime?: Date | string | null;
    endTime?: Date | string | null;
  } | null;
  status?: string | null;
  isVirtual?: boolean | null;
  isActive?: boolean | null;
  startedAt?: Date | string | null;
  completedAt?: Date | string | null;
  hasAttendanceRecord?: boolean | null;
};

export type AnnotatedRoute<T> = T & {
  driverStatus: DriverFacingStatus;
  managementStatus: 'ACTIVE' | 'INACTIVE';
};

const toDateOrNull = (value?: Date | string | null): Date | null => {
  if (!value) {
    return null;
  }
  const result = new Date(value);
  return Number.isNaN(result.getTime()) ? null : result;
};

const combineDateAndTime = (
  dateValue?: Date | string | null,
  timeValue?: Date | string | null,
): Date | null => {
  const datePart = toDateOrNull(dateValue);
  const timePart = toDateOrNull(timeValue);

  if (!datePart && !timePart) {
    return null;
  }

  if (datePart && !timePart) {
    return datePart;
  }

  if (!datePart && timePart) {
    return timePart;
  }

  const safeDate = datePart!;
  const safeTime = timePart!;
  const combined = new Date(safeDate.getTime());
  combined.setHours(
    safeTime.getHours(),
    safeTime.getMinutes(),
    safeTime.getSeconds(),
    safeTime.getMilliseconds(),
  );
  return combined;
};

const ACTIVE_STATUSES = new Set(['ACTIVE', 'IN_PROGRESS']);
const COMPLETED_STATUSES = new Set(['COMPLETED', 'INACTIVE']);
const CANCELLED_STATUSES = new Set(['CANCELLED']);
const AUTO_ACTIVATION_WINDOW_MS = 2 * 60 * 60 * 1000;

export const resolveRouteStartTime = (route: SchedulableRoute): Date | null => {
  const startedAt = toDateOrNull(route.startedAt);
  if (startedAt) {
    return startedAt;
  }

  const directStart = toDateOrNull(route.startTime);
  if (directStart) {
    return directStart;
  }

  const combinedStart = combineDateAndTime(route.date, route.shift?.startTime);
  if (combinedStart) {
    return combinedStart;
  }

  const shiftStart = toDateOrNull(route.shift?.startTime);
  if (shiftStart) {
    return shiftStart;
  }

  const dateOnly = toDateOrNull(route.date);
  return dateOnly ?? null;
};

export const resolveRouteEndTime = (route: SchedulableRoute): Date | null => {
  const completedAt = toDateOrNull(route.completedAt);
  if (completedAt) {
    return completedAt;
  }

  const directEnd = toDateOrNull(route.endTime);
  if (directEnd) {
    return directEnd;
  }

  const combinedEnd = combineDateAndTime(route.date, route.shift?.endTime);
  if (combinedEnd) {
    return combinedEnd;
  }

  return toDateOrNull(route.shift?.endTime) ?? null;
};

export const deriveDriverStatus = (
  route: SchedulableRoute,
  referenceDate: Date = new Date(),
): DriverFacingStatus => {
  const normalizedStatus = typeof route.status === 'string' ? route.status.toUpperCase() : '';
  const isVirtual = route.isVirtual === true;

  // Explicit cancellation overrides everything (except virtual routes)
  if (CANCELLED_STATUSES.has(normalizedStatus) && !isVirtual) {
    return 'CANCELLED';
  }

  const start = resolveRouteStartTime(route);
  const end = resolveRouteEndTime(route);
  const referenceTime = referenceDate.getTime();

  const startTime = start?.getTime() ?? null;
  const endTime = end?.getTime() ?? null;

  // Check if driver marked as complete and if attendance exists
  const driverMarkedComplete = COMPLETED_STATUSES.has(normalizedStatus) || Boolean(toDateOrNull(route.completedAt));
  const hasAttendance = route.hasAttendanceRecord === true;

  // 1. Check if route is explicitly completed (this should override time-based status)
  if (driverMarkedComplete) {
    return 'COMPLETED';
  }

  // Determine time-based active window (2 hours around start time)
  let activeWindowStart: number | null = null;
  let activeWindowEnd: number | null = null;

  if (startTime !== null) {
    activeWindowStart = startTime - AUTO_ACTIVATION_WINDOW_MS;
    activeWindowEnd = endTime ?? (startTime + AUTO_ACTIVATION_WINDOW_MS);
  } else if (endTime !== null) {
    activeWindowStart = endTime - AUTO_ACTIVATION_WINDOW_MS;
    activeWindowEnd = endTime;
  }

  // 2. Check if we're in the active window (ACTIVE) - purely time-based
  if (activeWindowStart !== null && activeWindowEnd !== null) {
    if (referenceTime >= activeWindowStart && referenceTime <= activeWindowEnd) {
      return 'ACTIVE';
    }
  }

  // 3. Check if we're before the route starts (UPCOMING)
  // Do this BEFORE checking if past, to avoid misclassifying future routes
  if (startTime !== null && referenceTime < (startTime - AUTO_ACTIVATION_WINDOW_MS)) {
    return 'UPCOMING';
  }

  // 4. Determine if route is in the past
  // Only mark as past if we're beyond the end time OR beyond the start time + window
  const isPastRoute = 
    (endTime !== null && referenceTime > endTime) ||
    (endTime === null && startTime !== null && referenceTime > (startTime + AUTO_ACTIVATION_WINDOW_MS));

  if (isPastRoute) {
    // Route is in the past - check if attendance exists (even without explicit completion)
    if (hasAttendance) {
      return 'COMPLETED';
    }
    // Missing BOTH completion AND attendance = CANCELLED
    return 'CANCELLED';
  }

  // 5. Between active window and start (shouldn't normally happen, but handle gracefully)
  if (startTime !== null && referenceTime < startTime) {
    return 'UPCOMING';
  }

  // 6. Default fallback
  return 'UPCOMING';
};

export const annotateRouteWithStatuses = <T extends SchedulableRoute>(
  route: T,
  referenceDate: Date = new Date(),
): AnnotatedRoute<T> => ({
  ...route,
  driverStatus: deriveDriverStatus(route, referenceDate),
  managementStatus: route.isActive === false ? 'INACTIVE' : 'ACTIVE',
});

export const annotateRouteCollection = <T extends SchedulableRoute>(
  routes: T[],
  referenceDate: Date = new Date(),
): AnnotatedRoute<T>[] => routes.map((route) => annotateRouteWithStatuses(route, referenceDate));

export const formatRouteForManagement = <T extends SchedulableRoute>(
  route: T,
  referenceDate: Date = new Date(),
) => {
  const annotated = annotateRouteWithStatuses(route, referenceDate);
  const rawStatus = annotated.status;

  return {
    ...annotated,
    rawStatus,
    status: annotated.managementStatus,
  };
};

export const formatRoutesForManagement = <T extends SchedulableRoute>(
  routes: T[],
  referenceDate: Date = new Date(),
) => routes.map((route) => formatRouteForManagement(route, referenceDate));

