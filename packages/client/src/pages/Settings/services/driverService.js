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
      // Get current and previous month's data
      const currentDate = new Date();
      
      // Create previous month date
      const previousMonthDate = new Date();
      previousMonthDate.setMonth(currentDate.getMonth() - 1);
      
      // Format dates for API
      const currentMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
      const previousMonth = `${previousMonthDate.getFullYear()}-${String(previousMonthDate.getMonth() + 1).padStart(2, '0')}`;
      
      // Get driver data
      const [currentDrivers, drivers, historyData] = await Promise.all([
        api.get(`/drivers/stats`),
        api.get('/drivers'),
        api.get('/drivers/history')
      ]);
      
      // Get monthly data points
      const currentMonthData = historyData.data?.find(item => 
        item.month === currentMonth
      ) || { count: 0 };
      
      const previousMonthData = historyData.data?.find(item => 
        item.month === previousMonth
      ) || { count: 0 };
      
      // Calculate monthly change
      const monthlyChange = currentMonthData.count - previousMonthData.count;
      
      // Count active vs inactive drivers
      const active = drivers.data?.filter(driver => !driver.deleted).length || 0;
      const inactive = (drivers.data?.length || 0) - active;
      
      // Calculate assignments
      const assignedDrivers = drivers.data?.filter(driver => driver.routeId).length || 0;
      const assignmentRate = drivers.data?.length ? 
        Math.round((assignedDrivers / drivers.data.length) * 100) : 0;
      
      const stats = {
        total: drivers.data?.length || 0,
        active,
        inactive,
        assigned: assignedDrivers,
        assignmentRate,
        monthlyChange,
        ...currentDrivers.data
      };
      
      this.cache.stats = stats;
      this.cache.statsLastFetched = Date.now();
      
      return stats;
    } catch (error) {
      console.error("Error fetching driver stats, generating from driver list:", error);
      
      // Fallback: Calculate stats from driver list
      try {
        const drivers = await this.listDrivers(false);
        
        // Count active drivers
        const active = drivers.filter(driver => !driver.deleted).length;
        
        // Count assigned drivers
        const assigned = drivers.filter(driver => driver.routeId).length;
        
        const stats = {
          total: drivers.length,
          active,
          inactive: drivers.length - active,
          assigned,
          assignmentRate: drivers.length ? Math.round((assigned / drivers.length) * 100) : 0,
          monthlyChange: 0 // No historical data in fallback
        };
        
        this.cache.stats = stats;
        this.cache.statsLastFetched = Date.now();
        
        return stats;
      } catch (fallbackError) {
        console.error("Fallback driver stats calculation failed:", fallbackError);
        
        // Return minimal default stats if everything fails
        return {
          total: 0,
          active: 0,
          inactive: 0,
          assigned: 0,
          assignmentRate: 0,
          monthlyChange: 0
        };
      }
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