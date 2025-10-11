import api from './api';
import { AsyncHandler } from '../utils/asyncHandler';

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

  getMyRoutes: AsyncHandler(async (filters = {}) => {
    const response = await api.get('/drivers/me/routes', { params: filters });
    return response.data;
  }),

  getRoutes: AsyncHandler(async (filters = {}) => {
    const response = await api.get('/drivers/me/routes', { params: filters });
    return response.data;
  }),

  getRoute: AsyncHandler(async (routeId) => {
    const response = await api.get(`/routes/${routeId}/driver-view`);
    return response.data;
  }),

  updateRouteStatus: AsyncHandler(async (routeId, status) => {
    const response = await api.patch(`/routes/${routeId}/status`, { status });
    return response.data;
  }),

  markStopCompleted: AsyncHandler(async (routeId, stopId, data) => {
    const response = await api.post(`/routes/${routeId}/stops/${stopId}/checkin`, {
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
    const today = new Date().toISOString().split('T')[0];
    const response = await api.get('/drivers/me/routes', {
      params: { from: today, status: 'PENDING', limit }
    });
    return response.data;
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