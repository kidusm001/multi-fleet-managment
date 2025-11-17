import api from './api';

export const shuttleAvailabilityService = {
  // Get available shuttles for a shift
  // Options can include: date, startTime, endTime for time-based conflict detection
  getAvailableShuttlesForShift: async (shiftId, options = {}) => {
    try {
      const params = new URLSearchParams();
      
      // Add optional date/time parameters for precise availability checking
      if (options.date) {
        params.append('date', String(options.date));
      }
      if (options.startTime) {
        params.append('startTime', String(options.startTime));
      }
      if (options.endTime) {
        params.append('endTime', String(options.endTime));
      }
      
      const queryString = params.toString();
      const url = `/shuttles/shuttle-availability/shift/${shiftId}/available${queryString ? `?${queryString}` : ''}`;
      
      console.log('Fetching shuttles with URL:', url);
      
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      console.error('Error getting available shuttles:', error.response?.data || error.message);
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