import api from './api';

/**
 * Attendance Service
 * Handles all attendance-related API calls
 */
export const attendanceService = {
  /**
   * Get all attendance records with optional filters
   */
  async getAttendanceRecords(params = {}) {
    try {
      const response = await api.get('/attendance', { params });
      return response.data;
    } catch (error) {
      console.error("Error fetching attendance records:", error);
      throw error;
    }
  },

  /**
   * Get a specific attendance record
   */
  async getAttendanceRecord(id) {
    try {
      const response = await api.get(`/attendance/${id}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching attendance record:", error);
      throw error;
    }
  },

  /**
   * Create a new attendance record
   */
  async createAttendanceRecord(data) {
    try {
      const response = await api.post('/attendance', data);
      return response.data;
    } catch (error) {
      console.error("Error creating attendance record:", error);
      throw error;
    }
  },

  /**
   * Update an attendance record
   */
  async updateAttendanceRecord(id, data) {
    try {
      const response = await api.put(`/attendance/${id}`, data);
      return response.data;
    } catch (error) {
      console.error("Error updating attendance record:", error);
      throw error;
    }
  },

  /**
   * Delete an attendance record
   */
  async deleteAttendanceRecord(id) {
    try {
      const response = await api.delete(`/attendance/${id}`);
      return response.data;
    } catch (error) {
      console.error("Error deleting attendance record:", error);
      throw error;
    }
  },

  /**
   * Get attendance summary for a driver
   */
  async getDriverAttendanceSummary(driverId, startDate, endDate) {
    try {
      const params = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      
      const response = await api.get(`/attendance/summary/driver/${driverId}`, { params });
      return response.data;
    } catch (error) {
      console.error("Error fetching driver attendance summary:", error);
      throw error;
    }
  },

  /**
   * Get attendance summary for a vehicle
   */
  async getVehicleAttendanceSummary(vehicleId, startDate, endDate) {
    try {
      const params = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      
      const response = await api.get(`/attendance/summary/vehicle/${vehicleId}`, { params });
      return response.data;
    } catch (error) {
      console.error("Error fetching vehicle attendance summary:", error);
      throw error;
    }
  },

  /**
   * Bulk create attendance records
   */
  async bulkCreateAttendanceRecords(records) {
    try {
      const response = await api.post('/attendance/bulk', { records });
      return response.data;
    } catch (error) {
      console.error("Error bulk creating attendance records:", error);
      throw error;
    }
  },
};

export default attendanceService;
