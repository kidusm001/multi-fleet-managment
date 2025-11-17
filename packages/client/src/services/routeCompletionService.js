import api from '@/services/api';
import { AsyncHandler } from '@/utils/asyncHandler';

/**
 * Route Completion Service
 * Handles route completion operations - simple button-click completion tracking
 */
class RouteCompletionService {
  /**
   * Complete a route (simple button click)
   * @param {string} routeId Route ID to complete
   * @returns {Promise<Object>} Completion record
   */
  completeRoute = AsyncHandler(async (routeId) => {
    const response = await api.post('/routes/completions', { routeId });
    return response.data;
  });

  /**
   * Get route completions
   * @param {Object} filters Query filters
   * @param {string} filters.driverId Filter by driver ID
   * @param {string} filters.startDate Start date (ISO 8601)
   * @param {string} filters.endDate End date (ISO 8601)
   * @param {number} filters.limit Limit results
   * @returns {Promise<Object>} Completions list with route info
   */
  getCompletions = AsyncHandler(async (filters = {}) => {
    const params = new URLSearchParams();
    
    if (filters.driverId) params.append('driverId', filters.driverId);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.limit) params.append('limit', filters.limit.toString());

    const response = await api.get(`/routes/completions?${params.toString()}`);
    return response.data;
  });

  /**
   * Get route completion statistics
   * @returns {Promise<Object>} Aggregated statistics
   */
  getStats = AsyncHandler(async () => {
    const response = await api.get('/routes/completions/stats');
    return response.data;
  });

  /**
   * Get completions for today
   * @returns {Promise<Object>} Today's completions
   */
  getTodayCompletions = AsyncHandler(async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return this.getCompletions({
      startDate: today.toISOString(),
      endDate: tomorrow.toISOString()
    });
  });

  /**
   * Get completions for a specific driver
   * @param {string} driverId Driver ID
   * @param {Object} options Additional options
   * @returns {Promise<Object>} Driver's completions
   */
  getDriverCompletions = AsyncHandler(async (driverId, options = {}) => {
    return this.getCompletions({
      driverId,
      ...options
    });
  });

  /**
   * Get completion count for date range
   * @param {string} startDate Start date (ISO 8601)
   * @param {string} endDate End date (ISO 8601)
   * @returns {Promise<number>} Number of completions
   */
  getCompletionCount = AsyncHandler(async (startDate, endDate) => {
    const data = await this.getCompletions({ startDate, endDate });
    return data.total;
  });
}

// Create and export a singleton instance
export const routeCompletionService = new RouteCompletionService();
