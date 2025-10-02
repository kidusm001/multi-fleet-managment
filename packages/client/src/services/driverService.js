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
  })
};