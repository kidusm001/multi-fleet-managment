export type DriverFacingStatus = 'UPCOMING' | 'ACTIVE' | 'COMPLETED';

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

export const resolveRouteStartTime = (route: SchedulableRoute): Date | null => {
  const directStart = toDateOrNull(route.startTime);
  if (directStart) {
    return directStart;
  }
  return toDateOrNull(route.shift?.startTime) ?? null;
};

export const resolveRouteEndTime = (route: SchedulableRoute): Date | null => {
  const directEnd = toDateOrNull(route.endTime);
  if (directEnd) {
    return directEnd;
  }
  return toDateOrNull(route.shift?.endTime) ?? null;
};

export const deriveDriverStatus = (
  route: SchedulableRoute,
  referenceDate: Date = new Date(),
): DriverFacingStatus => {
  const normalizedStatus = typeof route.status === 'string' ? route.status.toUpperCase() : '';

  if (route.isVirtual) {
    return 'UPCOMING';
  }

  if (normalizedStatus === 'CANCELLED' || normalizedStatus === 'COMPLETED') {
    return 'COMPLETED';
  }

  const start = resolveRouteStartTime(route);
  const end = resolveRouteEndTime(route);

  if (route.isActive === false) {
    if (start && referenceDate.getTime() < start.getTime()) {
      return 'UPCOMING';
    }
    return 'COMPLETED';
  }

  if (normalizedStatus === 'IN_PROGRESS' || normalizedStatus === 'ACTIVE') {
    return 'ACTIVE';
  }

  if (start) {
    if (referenceDate.getTime() < start.getTime()) {
      return 'UPCOMING';
    }
  } else if (normalizedStatus === 'PENDING') {
    return 'UPCOMING';
  }

  if (end && referenceDate.getTime() > end.getTime()) {
    return 'COMPLETED';
  }

  if (normalizedStatus === 'INACTIVE') {
    return 'COMPLETED';
  }

  if (normalizedStatus === 'PENDING') {
    return 'ACTIVE';
  }

  return 'ACTIVE';
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

