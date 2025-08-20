import api from '@/services/api';
import { AsyncHandler } from '@/utils/asyncHandler';

/**
 * Driver Management Service
 * Handles all driver-related API interactions with caching
 */
class DriverService {
  constructor() {
    this.cache = {
      drivers: null,
      lastFetched: null,
      cacheTimeout: 5 * 60 * 1000, // 5 minutes cache timeout
      driverDetails: new Map(),
      stats: null,
      statsLastFetched: null
    };
  }

  /**
   * Create a new driver
   * @param {Object} driverData Driver data
   * @returns {Promise<Object>} Created driver data
   */
  createDriver = AsyncHandler(async (driverData) => {
    const response = await api.post('/drivers', driverData);
    this.clearCache();
    return response.data;
  });

  /**
   * Get all active drivers
   * @param {boolean} useCache Whether to use cached data
   * @returns {Promise<Array>} List of drivers
   */
  listDrivers = AsyncHandler(async (useCache = true) => {
    if (useCache && 
      this.cache.drivers && 
      this.cache.lastFetched && 
      Date.now() - this.cache.lastFetched < this.cache.cacheTimeout
    ) {
      return this.cache.drivers;
    }

    const response = await api.get('/drivers');
    this.cache.drivers = response.data;
    this.cache.lastFetched = Date.now();
    return response.data;
  });

  /**
   * Get driver by ID
   * @param {number} driverId Driver ID
   * @param {boolean} useCache Whether to use cached data
   * @returns {Promise<Object>} Driver data
   */
  getDriver = AsyncHandler(async (driverId, useCache = true) => {
    const cacheKey = `driver_${driverId}`;
    const cachedData = this.cache.driverDetails.get(cacheKey);

    if (useCache && 
      cachedData && 
      Date.now() - cachedData.timestamp < this.cache.cacheTimeout
    ) {
      return cachedData.driver;
    }

    const response = await api.get(`/drivers/${driverId}`);
    this.cache.driverDetails.set(cacheKey, {
      driver: response.data,
      timestamp: Date.now()
    });
    return response.data;
  });

  /**
   * Update driver
   * @param {number} driverId Driver ID
   * @param {Object} updates Fields to update
   * @returns {Promise<Object>} Updated driver data
   */
  updateDriver = AsyncHandler(async (driverId, updates) => {
    const response = await api.patch(`/drivers/${driverId}`, updates);

    // Update cache if it exists
    if (this.cache.drivers) {
      this.cache.drivers = this.cache.drivers.map(driver =>
        driver.id === driverId ? { ...driver, ...response.data } : driver
      );
    }
    this.cache.driverDetails.delete(`driver_${driverId}`);
    return response.data;
  });

  /**
   * Delete driver
   * @param {number} driverId Driver ID
   * @returns {Promise<boolean>} Success status
   */
  deleteDriver = AsyncHandler(async (driverId) => {
    await api.delete(`/drivers/${driverId}`);
    
    // Update cache if it exists
    if (this.cache.drivers) {
      this.cache.drivers = this.cache.drivers.filter(driver => driver.id !== driverId);
    }
    this.cache.driverDetails.delete(`driver_${driverId}`);
    return true;
  });

  /**
   * Get driver statistics
   * Returns aggregated stats including counts and trends
   * 
   * @param {boolean} useCache Whether to use cached data
   * @returns {Promise<Object>} Driver statistics object
   */
  getDriverStats = AsyncHandler(async (useCache = true) => {
    if (useCache && 
        this.cache.stats && 
        this.cache.statsLastFetched && 
        Date.now() - this.cache.statsLastFetched < this.cache.cacheTimeout) {
      return this.cache.stats;
    }

    try {
      // Compute stats from current driver list (no /drivers/stats or /drivers/history endpoints available)
      const drivers = await this.listDrivers(false);

      const total = drivers.length;
      const active = drivers.filter(d => !d.deleted).length;
      const inactive = total - active;
      const assigned = drivers.filter(d => d.routeId).length;
      const assignmentRate = total ? Math.round((assigned / total) * 100) : 0;

      // Monthly change based on createdAt timestamp
      const now = new Date();
      const currentY = now.getFullYear();
      const currentM = now.getMonth();
      const prev = new Date(now);
      prev.setMonth(now.getMonth() - 1);
      const prevY = prev.getFullYear();
      const prevM = prev.getMonth();

      const countFor = (y, m) => drivers.filter(d => {
        if (!d?.createdAt) return false;
        const dt = new Date(d.createdAt);
        return dt.getFullYear() === y && dt.getMonth() === m;
      }).length;

      const monthlyChange = countFor(currentY, currentM) - countFor(prevY, prevM);

      const stats = { total, active, inactive, assigned, assignmentRate, monthlyChange };

      this.cache.stats = stats;
      this.cache.statsLastFetched = Date.now();
      return stats;
    } catch (error) {
      console.warn("Driver stats computation failed; returning defaults", error?.message || error);
      return { total: 0, active: 0, inactive: 0, assigned: 0, assignmentRate: 0, monthlyChange: 0 };
    }
  });

  /**
   * Clear all caches
   */
  clearCache() {
    this.cache.drivers = null;
    this.cache.lastFetched = null;
    this.cache.driverDetails.clear();
    this.cache.stats = null;
    this.cache.statsLastFetched = null;
  }

  /**
   * Clear specific driver cache
   * @param {number} driverId Driver ID
   */
  clearDriverCache(driverId) {
    this.cache.driverDetails.delete(`driver_${driverId}`);
    if (this.cache.drivers) {
      this.cache.drivers = this.cache.drivers.filter(driver => driver.id !== driverId);
    }
  }
}

// Create and export a singleton instance
export const driverService = new DriverService();