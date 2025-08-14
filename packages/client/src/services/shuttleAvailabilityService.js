import api from './api';

export const shuttleAvailabilityService = {
  // Get available shuttles for a shift
  getAvailableShuttlesForShift: async (shiftId) => {
    try {
      const response = await api.get(`/shuttles/shuttle-availability/shift/${shiftId}/available`);
      return response.data;
    } catch (error) {
      console.error('Error getting available shuttles:', error);
      throw error;
    }
  },

  // Check availability for a specific shuttle
  checkShuttleAvailability: async (shuttleId, shiftId, date, startTime, endTime) => {
    try {
      const response = await api.post(`/clusters/availability/${shuttleId}/${shiftId}`, {
        date,
        proposedStartTime: startTime,
        proposedEndTime: endTime
      });
      return response.data;
    } catch (error) {
      console.error('Error checking shuttle availability:', error);
      throw error;
    }
  },

  // Validate route time window
  validateRouteTimeWindow: async (shuttleId, startTime, endTime, routeId = undefined) => {
    try {
      const response = await api.post('/routes/validate-time-window', {
        shuttleId,
        startTime,
        endTime,
        routeId
      });
      return response.data;
    } catch (error) {
      console.error('Error validating route time window:', error);
      throw error;
    }
  }
};

export default shuttleAvailabilityService; 