import api from './api';

/**
 * Location Service
 * Handles all location-related API interactions
 */
class LocationService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Get all locations for the active organization
   */
  async getLocations(type = null) {
    // Note: We don't include orgId in cache key since the backend uses session-based org scoping
    // But we still want to clear cache when org changes (handled by components)
    const cacheKey = `locations_${type || 'all'}`;
    
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }
    }

    const params = {};
    if (type) params.type = type;

    const response = await api.get('/locations', { params });
    
    // Cache the result
    this.cache.set(cacheKey, {
      data: response.data,
      timestamp: Date.now()
    });

    return response.data;
  }

  /**
   * Get location by ID
   */
  async getLocationById(id) {
    const response = await api.get(`/locations/${id}`);
    return response.data;
  }

  /**
   * Create a new location
   */
  async createLocation(locationData) {
    const response = await api.post('/locations', locationData);
    
    // Clear cache after creating
    this.clearCache();
    
    return response.data;
  }

  /**
   * Update location
   */
  async updateLocation(id, locationData) {
    const response = await api.put(`/locations/${id}`, locationData);
    
    // Clear cache after updating
    this.clearCache();
    
    return response.data;
  }

  /**
   * Delete location
   */
  async deleteLocation(id) {
    const response = await api.delete(`/locations/${id}`);
    
    // Clear cache after deleting
    this.clearCache();
    
    return response.data;
  }

  /**
   * Get employees for a specific location
   */
  async getLocationEmployees(id) {
    const response = await api.get(`/locations/${id}/employees`);
    return response.data;
  }

  /**
   * Get routes for a specific location
   */
  async getLocationRoutes(id) {
    const response = await api.get(`/locations/${id}/routes`);
    return response.data;
  }

  /**
   * Clear the service cache
   */
  clearCache() {
    this.cache.clear();
  }

  /**
   * Clear cache and reset state - useful for organization switching
   */
  reset() {
    this.clearCache();
  }

  /**
   * Location types enum
   */
  static get TYPES() {
    return {
      BRANCH: 'BRANCH',
      HQ: 'HQ'
    };
  }
}

// Create a singleton instance
export const locationService = new LocationService();
export default LocationService;