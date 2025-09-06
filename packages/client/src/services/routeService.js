import { AsyncHandler } from '../utils/asyncHandler';

import api from './api';

class RouteService {
  constructor() {
    // In-memory cache for routes
    this.cache = {
      routes: null,
      lastFetched: null,
      cacheTimeout: 2 * 60 * 1000, // 2 minutes cache timeout (shorter because routes change frequently)
      routeDetails: new Map(), // Cache for individual route details
    };
  }

  /**
   * Get all routes with optional caching
   * @param {boolean} useCache - Whether to use cached data if available
   * @returns {Promise<Array>} Array of routes
   */
  getAllRoutes = AsyncHandler(async (useCache = true) => {
    // Return cached data if it's still valid
    if (useCache &&
      this.cache.routes &&
      this.cache.lastFetched &&
      Date.now() - this.cache.lastFetched < this.cache.cacheTimeout) {
      return this.cache.routes;
    }

    const response = await api.get('/routes', {
      params: {
        include: 'shuttle,shift,stops.employee.department', // Include all necessary relations
      },
    });

    // Update cache
    this.cache.routes = response.data;
    this.cache.lastFetched = Date.now();

    return response.data;
  });

  /**
   * Get routes by shift
   * @param {number} shiftId - Shift ID
   * @returns {Promise<Array>} Array of routes for the shift
   */
  getRoutesByShift = AsyncHandler(async (shiftId) => {
    const response = await api.get(`/routes/shift/${shiftId}`, {
      params: {
        include: 'shuttle,stops.employee',
      },
    });
    return response.data;
  });

  /**
   * Get route by ID with all related information
   * @param {number} id - Route ID
   * @returns {Promise<Object>} Route object with related data
   */
  getRouteById = AsyncHandler(async (id) => {
    // Check cache first
    const cacheKey = `route_${id}`;
    const cachedData = this.cache.routeDetails.get(cacheKey);

    if (cachedData && Date.now() - cachedData.timestamp < this.cache.cacheTimeout) {
      return cachedData.route;
    }

    const response = await api.get(`/routes/${id}`, {
      params: {
        include: 'shuttle,shift,stops.employee.department',
      },
    });

    // Update cache
    this.cache.routeDetails.set(cacheKey, {
      route: response.data,
      timestamp: Date.now(),
    });

    return response.data;
  });

  /**
   * Create a new route
   * @param {Object} routeData - Route data including stops and employees
   * @returns {Promise<Object>} Created route
   */
  createRoute = AsyncHandler(async (routeData) => {
    const response = await api.post('/routes', routeData);

    // Invalidate cache
    this.clearCache();

    return response.data;
  });

  /**
   * Update a route
   * @param {number} id - Route ID
   * @param {Object} updates - Update data
   * @returns {Promise<Object>} Updated route
   */
  updateRoute = AsyncHandler(async (id, updates) => {
    const response = await api.put(`/routes/${id}`, {
      ...updates,
      totalDistance: parseFloat(updates.totalDistance.toFixed(2)),
      totalTime: Math.round(updates.totalTime),
    });

    // Update cache if it exists
    if (this.cache.routes) {
      this.cache.routes = this.cache.routes.map(route =>
        route.id === id ? { ...route, ...response.data } : route
      );
    }
    this.cache.routeDetails.delete(`route_${id}`);

    return response.data;
  });

  /**
   * Delete a route
   * @param {number} id - Route ID
   * @returns {Promise<void>}
   */
  deleteRoute = AsyncHandler(async (id) => {
    await api.delete(`/routes/${id}`);

    // Update cache if it exists
    if (this.cache.routes) {
      this.cache.routes = this.cache.routes.filter(route => route.id !== id);
    }
    this.cache.routeDetails.delete(`route_${id}`);
  });

  /**
   * Get route stops
   * @param {number} routeId - Route ID
   * @returns {Promise<Array>} Array of stops
   */
  getRouteStops = AsyncHandler(async (routeId) => {
    const response = await api.get(`/routes/${routeId}/stops`, {
      params: {
        include: 'employee.department',
      },
    });
    return response.data;
  });

  /**
   * Update route stops
   * @param {number} routeId - Route ID
   * @param {Array} stops - Array of stop data
   * @returns {Promise<Array>} Updated stops
   */
  updateRouteStops = AsyncHandler(async (routeId, stops) => {
    const response = await api.put(`/routes/${routeId}/stops`, { stops });

    // Invalidate route cache
    this.cache.routeDetails.delete(`route_${routeId}`);
    if (this.cache.routes) {
      this.cache.routes = this.cache.routes.map(route => {
        if (route.id === routeId) {
          return { ...route, stops: response.data };
        }
        return route;
      });
    }

    return response.data;
  });

  /**
   * Get routes with unique locations
   * @returns {Promise<Array>} Array of routes with unique locations
   */
  getRoutesWithUniqueLocations = AsyncHandler(async () => {
    const response = await api.get('/routes/unique-locations');
    return response.data;
  });

  /**
   * Validate route time window
   * @param {Object} params - Validation parameters
   * @returns {Promise<Object>} Validation result
   */
  validateRouteTimeWindow = AsyncHandler(async ({ shuttleId, startTime, endTime, routeId }) => {
    const response = await api.post('/routes/validate-time-window', {
      shuttleId,
      startTime,
      endTime,
      routeId,
    });
    return response.data;
  });

  /**
   * Remove an employee from a route
   * @param {Object} employeeData - Employee data including route ID, employee ID, total distance, and total time
   * @returns {Promise<Object>} Response data
   */
  removeEmployeeFromRoute = AsyncHandler(async (employeeData) => {
    const { routeId, employee, totalDistance, totalTime } = employeeData;
    
    if (!routeId || !employee?.id) {
      throw new Error('Route ID and Employee ID are required');
    }

    const employeeIdStr = String(employee.id).trim();

    // Include the new metrics in the request body
    const response = await api.patch(
      `/routes/${routeId}/employees/${employeeIdStr}/remove-stop`,
      {
        totalDistance,
        totalTime
      }
    );

    // Invalidate route cache
    this.cache.routeDetails.delete(`route_${routeId}`);
    if (this.cache.routes) {
      this.clearCache();
    }

    return response.data;
  });

  /**
   * Add an employee to a route
   * @param {number} routeId - Route ID
   * @param {string} employeeId - Employee ID (UUID)
   * @param {Object} routeMetrics - Route metrics after adding the employee
   * @returns {Promise<Object>} Response data
   */
  addEmployeeToRoute = AsyncHandler(async (routeId, employeeId, routeMetrics) => {
    // Validate inputs
    if (!routeId || !employeeId) {
      throw new Error('Route ID and Employee ID are required');
    }

    // Clean and validate both IDs as strings (cuid format)
    const cleanRouteId = String(routeId).trim();
    const cleanEmployeeId = String(employeeId).trim();

    // Validate route ID is not empty or NaN
    if (!cleanRouteId || cleanRouteId === 'NaN') {
      throw new Error('Invalid route ID');
    }

    // Validate employee ID is a valid UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(cleanEmployeeId)) {
      throw new Error('Invalid employee ID format');
    }

    // Log the request details for debugging
    console.log('Adding employee to route:', {
      routeId: cleanRouteId,
      employeeId: cleanEmployeeId,
      routeMetrics
    });

    try {
      const response = await api.patch(`/routes/${cleanRouteId}/employees/${cleanEmployeeId}/add-stop`, {
        totalDistance: routeMetrics?.totalDistance,
        totalTime: routeMetrics?.totalTime
      });

      // Invalidate route cache
      this.cache.routeDetails.delete(`route_${cleanRouteId}`);
      if (this.cache.routes) {
        this.clearCache();
      }

      return response.data;
    } catch (error) {
      // Log the error details for debugging
      console.error('Error adding employee to route:', error.response?.data || error);

      // Throw a more descriptive error
      throw new Error(
        error.response?.data?.error ||
        error.response?.data?.message ||
        error.response?.data?.errors?.[0] ||
        error.message ||
        'Failed to add employee to route'
      );
    }
  });

  /**
   * Clear all caches
   */
  clearCache() {
    this.cache.routes = null;
    this.cache.lastFetched = null;
    this.cache.routeDetails.clear();
  }

  /**
   * Clear specific route cache
   * @param {number} routeId - Route ID
   */
  clearRouteCache(routeId) {
    this.cache.routeDetails.delete(`route_${routeId}`);
    if (this.cache.routes) {
      this.cache.routes = this.cache.routes.filter(route => route.id !== routeId);
    }
  }
}

export const routeService = new RouteService();