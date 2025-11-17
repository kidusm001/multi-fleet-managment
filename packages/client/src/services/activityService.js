import api from './api';

/**
 * Activity Service
 * 
 * Provides methods to interact with the activity data API
 * Used to fetch system activities for auditing and dashboard displays
 */
class ActivityService {
  /**
   * Get recent system activities
   * 
   * @param {number} limit - Maximum number of activities to retrieve
   * @param {string} type - Optional filter by activity type
   * @returns {Promise<Array>} List of activity objects
   */
  async getRecentActivity(limit = 10, type = null) {
    try {
      const params = { limit };
      if (type) params.type = type;
      
      const response = await api.get('/activities', { params });
      return response.data;
    } catch (error) {
      // Handle 404 errors gracefully by returning empty array
      const status = error?.response?.status || error?.status;
      const is404 = status === 404 || 
                   error?.code === 'ERR_BAD_REQUEST' && error?.message?.includes('404') || 
                   error?.message?.includes('Not Found') ||
                   (error?.response?.data?.error === 'Not Found');
      
      if (is404) {
        // Silently return empty array for missing endpoint (no log spam)
        return [];
      }
      
      // For other errors in development, return mock data as fallback
      if (import.meta.env?.DEV) {
        console.warn('Using fallback mock activity data due to API error');
        return this.getMockActivities(limit);
      }
      
      // Re-throw other errors in production
      throw error;
    }
  }
  
  /**
   * Get activity logs for a specific entity
   * 
   * @param {string} entityType - Type of entity (employee, driver, shuttle, etc.)
   * @param {number} entityId - ID of the entity
   * @param {number} limit - Maximum number of activities to retrieve
   * @returns {Promise<Array>} List of activity objects
   */
  async getEntityActivity(entityType, entityId, limit = 20) {
    try {
      const response = await api.get(`/activities/${entityType}/${entityId}`, {
        params: { limit }
      });
      return response.data;
    } catch (error) {
      console.error(`Error fetching activities for ${entityType} ${entityId}:`, error);
      throw error;
    }
  }
  
  /**
   * Log a new activity in the system
   * 
   * @param {Object} activityData - Activity details
   * @returns {Promise<Object>} Created activity record
   */
  async logActivity(activityData) {
    try {
      const response = await api.post('/activities', activityData);
      return response.data;
    } catch (error) {
      console.error('Error logging activity:', error);
      throw error;
    }
  }
  
  /**
   * Get mock activities for development/fallback
   * This is only used when the API fails and environment is development
   * 
   * @private
   * @param {number} limit - Number of mock activities to generate
   * @returns {Array} List of mock activity objects
   */
  getMockActivities(limit = 10) {
    const now = new Date();
    const mockUsers = [
      { id: 1, name: "John Admin", role: "Admin" },
      { id: 2, name: "Sara Manager", role: "Manager" },
      { id: 3, name: "David HR", role: "HR" }
    ];
    
    const mockActions = [
      "updated employee records",
      "added new driver",
      "modified system settings",
      "created new department",
      "updated shuttle schedule",
      "assigned employees to routes",
      "generated route reports",
      "modified shift schedules"
    ];
    
    return Array.from({ length: Math.min(limit, 10) }, (_, i) => ({
      id: i + 1,
      user: mockUsers[i % mockUsers.length],
      action: mockActions[i % mockActions.length],
      timestamp: new Date(now - (i * 2 * 60 * 60 * 1000)), // Hours ago
      entityType: i % 2 === 0 ? "employee" : "driver",
      entityId: i + 100
    }));
  }
}

export const activityService = new ActivityService();
export default activityService;