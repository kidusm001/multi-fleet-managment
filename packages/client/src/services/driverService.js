import api from './api';
import { AsyncHandler } from '../utils/asyncHandler';

const VIRTUAL_PREFIX = 'virtual-';
const DATE_SUFFIX_PATTERN = /-\d{4}-\d{2}-\d{2}$/;

const devirtualizeRouteId = (routeId) => {
  if (typeof routeId !== 'string') {
    return routeId;
  }

  if (!routeId.startsWith(VIRTUAL_PREFIX)) {
    return routeId;
  }

  const trimmed = routeId.slice(VIRTUAL_PREFIX.length);
  const lastDashIndex = trimmed.lastIndexOf('-');
  if (lastDashIndex === -1) {
    return routeId;
  }

  const withoutIndex = trimmed.slice(0, lastDashIndex);
  if (!DATE_SUFFIX_PATTERN.test(withoutIndex.slice(-11))) {
    return routeId;
  }

  return withoutIndex.slice(0, -11) || routeId;
};

export const driverService = {
  getDrivers: AsyncHandler(async () => {
    const response = await api.get('/drivers');
    return response.data;
  }),

  getDriver: AsyncHandler(async (id) => {
    const response = await api.get(`/drivers/${id}`);
    return response.data;
  }),

  updateDriverStatus: AsyncHandler(async (id, status) => {
    const response = await api.patch(`/drivers/${id}/status`, { status });
    return response.data;
  }),

  assignShuttle: AsyncHandler(async (driverId, shuttleId) => {
    const response = await api.post(`/drivers/${driverId}/assign`, { shuttleId });
    return response.data;
  }),

  unassignShuttle: AsyncHandler(async (driverId) => {
    const response = await api.post(`/drivers/${driverId}/unassign`);
    return response.data;
  }),

  getUnassignedDrivers: AsyncHandler(async () => {
    const response = await api.get('/drivers/unassigned');
    return response.data;
  }),

  // Driver Portal specific methods
  getActiveRoute: AsyncHandler(async () => {
    const today = new Date().toISOString().split('T')[0];
    const response = await api.get('/drivers/me/routes', {
      params: { date: today, status: 'ACTIVE' }
    });
    return response.data[0] || null;
  }),

  getUpcomingRoute: AsyncHandler(async () => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowIso = tomorrow.toISOString().split('T')[0];
    const response = await api.get('/drivers/me/routes', {
      params: { from: today, to: tomorrowIso, status: 'UPCOMING', limit: 1 }
    });
    return response.data[0] || null;
  }),

  getMyRoutes: AsyncHandler(async (filters = {}) => {
    const response = await api.get('/drivers/me/routes', { params: filters });
    return response.data;
  }),

  getRoutes: AsyncHandler(async (filters = {}) => {
    const response = await api.get('/drivers/me/routes', { params: filters });
    return response.data;
  }),

  getRoute: AsyncHandler(async (routeId) => {
    const resolvedId = devirtualizeRouteId(routeId);
    const response = await api.get(`/drivers/me/routes/${resolvedId}`);
    return response.data;
  }),

  updateRouteStatus: AsyncHandler(async (routeId, status) => {
    const resolvedId = devirtualizeRouteId(routeId);
    const response = await api.patch(`/drivers/me/routes/${resolvedId}/status`, { status });
    return response.data;
  }),

  markStopCompleted: AsyncHandler(async (routeId, stopId, data) => {
    const resolvedId = devirtualizeRouteId(routeId);
    const response = await api.post(`/drivers/me/routes/${resolvedId}/stops/${stopId}/checkin`, {
      pickedUp: true,
      timestamp: new Date(),
      ...data
    });
    return response.data;
  }),

  getSchedule: AsyncHandler(async (dateRange) => {
    const response = await api.get('/drivers/me/schedule', { params: dateRange });
    return response.data;
  }),

  getUpcomingShifts: AsyncHandler(async (limit = 5) => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowIso = tomorrow.toISOString().split('T')[0];
    const response = await api.get('/drivers/me/routes', {
      params: { from: today, to: tomorrowIso, status: 'UPCOMING', limit }
    });
    return response.data || [];
  }),

  updateLocation: AsyncHandler(async (locationData) => {
    const response = await api.post('/drivers/me/location', locationData);
    return response.data;
  }),

  getStats: AsyncHandler(async (period = 'month') => {
    const response = await api.get('/drivers/me/stats', { params: { period } });
    return response.data;
  })
};