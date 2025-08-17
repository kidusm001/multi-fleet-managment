import api from '@/services/api';
import { AsyncHandler } from '@/utils/asyncHandler';

/**
 * Shift Management Service
 * Handles all shift-related API interactions with caching
 */
class ShiftService {
  constructor() {
    this.cache = {
      shifts: null,
      lastFetched: null,
      cacheTimeout: 5 * 60 * 1000, // 5 minutes cache timeout
      shiftDetails: new Map()
    };
  }

  /**
   * Create a new shift
   * @param {Object} shiftData Shift data
   * @returns {Promise<Object>} Created shift data
   */
  createShift = AsyncHandler(async (shiftData) => {
    const response = await api.post('/shifts', shiftData);
    this.clearCache();
    return response.data;
  });

  /**
   * Get all shifts
   * @param {boolean} useCache Whether to use cached data
   * @returns {Promise<Array>} List of shifts
   */
  listShifts = AsyncHandler(async (useCache = true) => {
    if (useCache && 
      this.cache.shifts && 
      this.cache.lastFetched && 
      Date.now() - this.cache.lastFetched < this.cache.cacheTimeout
    ) {
      return this.cache.shifts;
    }

    const response = await api.get('/shifts');
    this.cache.shifts = response.data;
    this.cache.lastFetched = Date.now();
    return response.data;
  });

  /**
   * Get shift by ID
   * @param {number} shiftId Shift ID
   * @param {boolean} useCache Whether to use cached data
   * @returns {Promise<Object>} Shift data
   */
  getShift = AsyncHandler(async (shiftId, useCache = true) => {
    const cacheKey = `shift_${shiftId}`;
    const cachedData = this.cache.shiftDetails.get(cacheKey);

    if (useCache && 
      cachedData && 
      Date.now() - cachedData.timestamp < this.cache.cacheTimeout
    ) {
      return cachedData.shift;
    }

    const response = await api.get(`/shifts/${shiftId}`);
    this.cache.shiftDetails.set(cacheKey, {
      shift: response.data,
      timestamp: Date.now()
    });
    return response.data;
  });

  /**
   * Update shift
   * @param {number} shiftId Shift ID
   * @param {Object} updates Fields to update
   * @returns {Promise<Object>} Updated shift data
   */
  updateShift = AsyncHandler(async (shiftId, updates) => {
    const response = await api.put(`/shifts/${shiftId}`, updates);

    // Update cache if it exists
    if (this.cache.shifts) {
      this.cache.shifts = this.cache.shifts.map(shift =>
        shift.id === shiftId ? { ...shift, ...response.data } : shift
      );
    }
    this.cache.shiftDetails.delete(`shift_${shiftId}`);
    return response.data;
  });

  /**
   * Delete shift
   * @param {number} shiftId Shift ID
   * @returns {Promise<boolean>} Success status
   */
  deleteShift = AsyncHandler(async (shiftId) => {
    await api.delete(`/shifts/${shiftId}`);
    
    // Update cache if it exists
    if (this.cache.shifts) {
      this.cache.shifts = this.cache.shifts.filter(shift => shift.id !== shiftId);
    }
    this.cache.shiftDetails.delete(`shift_${shiftId}`);
    return true;
  });

  /**
   * Get employees by shift ID
   * @param {number} shiftId Shift ID
   * @returns {Promise<Array>} List of employees in the shift
   */
  getShiftEmployees = AsyncHandler(async (shiftId) => {
    const response = await api.get(`/shifts/${shiftId}/employees`);
    return response.data.employees || [];
  });

  /**
   * Clear all caches
   */
  clearCache() {
    this.cache.shifts = null;
    this.cache.lastFetched = null;
    this.cache.shiftDetails.clear();
  }

  /**
   * Clear specific shift cache
   * @param {number} shiftId Shift ID
   */
  clearShiftCache(shiftId) {
    this.cache.shiftDetails.delete(`shift_${shiftId}`);
    if (this.cache.shifts) {
      // Don't remove from list, just ensure we'll fetch fresh data next time
      this.cache.lastFetched = null;
    }
  }
  
  /**
   * Get available time zones
   * @returns {Array<string>} List of time zone names
   */
  getTimeZones() {
    // Return time zones based on IANA time zone database
    return [
      "Africa/Addis_Ababa",
      "Africa/Cairo",
      "Africa/Johannesburg",
      "Africa/Lagos",
      "Africa/Nairobi",
      "America/Chicago",
      "America/Denver",
      "America/Los_Angeles",
      "America/New_York",
      "America/Phoenix",
      "America/Toronto",
      "Asia/Dubai",
      "Asia/Hong_Kong",
      "Asia/Jerusalem", 
      "Asia/Shanghai",
      "Asia/Singapore",
      "Asia/Tokyo",
      "Australia/Melbourne",
      "Australia/Sydney",
      "Europe/Berlin",
      "Europe/London",
      "Europe/Moscow",
      "Europe/Paris",
      "Pacific/Auckland",
      "UTC"
    ];
  }

  /**
   * Format time based on timezone
   * @param {string} time Time as HH:mm
   * @param {string} timezone IANA timezone identifier
   * @returns {string} Formatted time with timezone info
   */
  formatTimeWithZone(time, timezone) {
    try {
      if (!time) return "N/A";
      
      // Create a date object using today's date and the time string
      const [hours, minutes] = time.split(':');
      const date = new Date();
      date.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0);
      
      // Format the time according to the timezone
      const formatter = new Intl.DateTimeFormat('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: timezone || 'UTC',
        hour12: true
      });
      
      return formatter.format(date);
    } catch (error) {
      console.error('Error formatting time with timezone:', error);
      return time || "N/A";
    }
  }
}

// Create and export a singleton instance
export const shiftService = new ShiftService();