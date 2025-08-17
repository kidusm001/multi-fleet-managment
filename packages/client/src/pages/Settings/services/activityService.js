import { api } from './apiService';

/**
 * Activity Service for Settings Dashboard
 * 
 * Provides methods to interact with the activity data API
 * Used to fetch system activities for auditing and dashboard displays
 */
class ActivityService {
  constructor() {
    this.cache = {
      recentActivities: null,
      entityActivities: new Map(),
      lastFetched: null,
      cacheTimeout: 2 * 60 * 1000, // 2 minutes cache timeout
    };
  }

  /**
   * Get recent system activities
   * 
   * @param {number} limit - Maximum number of activities to retrieve
   * @param {string} type - Optional filter by activity type
   * @returns {Promise<Array>} List of activity objects
   */
  async getRecentActivity(limit = 10, type = null) {
    // Check cache first
    if (
      this.cache.recentActivities &&
      this.cache.lastFetched &&
      Date.now() - this.cache.lastFetched < this.cache.cacheTimeout
    ) {
      return this.cache.recentActivities;
    }

    try {
      const params = { limit };
      if (type) params.type = type;
      
      const response = await api.get('/activities', { params });
      
      // Update cache
      this.cache.recentActivities = response.data;
      this.cache.lastFetched = Date.now();
      
      return response.data;
    } catch (error) {
      console.error('Error fetching recent activities:', error);
      
      // NEVER use mock data, return empty array instead
      return [];
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
    // Check cache first
    const cacheKey = `${entityType}_${entityId}`;
    const cachedData = this.cache.entityActivities.get(cacheKey);
    
    if (cachedData && Date.now() - cachedData.timestamp < this.cache.cacheTimeout) {
      return cachedData.data;
    }

    try {
      const response = await api.get(`/activities/${entityType}/${entityId}`, {
        params: { limit }
      });
      
      // Update cache
      this.cache.entityActivities.set(cacheKey, {
        data: response.data,
        timestamp: Date.now()
      });
      
      return response.data;
    } catch (error) {
      console.error(`Error fetching activities for ${entityType} ${entityId}:`, error);
      return [];
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
      
      // Clear cache when new activity is added
      this.clearCache();
      
      return response.data;
    } catch (error) {
      console.error('Error logging activity:', error);
      throw error;
    }
  }
  
  /**
   * Clear cache
   */
  clearCache() {
    this.cache.recentActivities = null;
    this.cache.lastFetched = null;
    this.cache.entityActivities.clear();
  }
}

export const activityService = new ActivityService();
export default activityService;