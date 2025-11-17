import { useState, useCallback } from 'react';
import { routeCompletionService } from '@/services/routeCompletionService';
import { toast } from 'sonner';

/**
 * useRouteCompletion Hook
 * Provides state management for route completion operations
 * 
 * @returns {Object} Hook state and methods
 */
export const useRouteCompletion = () => {
  const [loading, setLoading] = useState(false);
  const [completions, setCompletions] = useState([]);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);

  /**
   * Complete a route
   */
  const completeRoute = useCallback(async (routeId) => {
    setLoading(true);
    setError(null);
    try {
      const result = await routeCompletionService.completeRoute(routeId);
      toast.success(result.message || 'Route completed successfully!');
      return result.completion;
    } catch (err) {
      setError(err.message);
      toast.error(err.message || 'Failed to complete route');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Fetch completions with optional filters
   */
  const fetchCompletions = useCallback(async (filters = {}) => {
    setLoading(true);
    setError(null);
    try {
      const data = await routeCompletionService.getCompletions(filters);
      setCompletions(data.completions || []);
      return data;
    } catch (err) {
      setError(err.message);
      toast.error(err.message || 'Failed to fetch completions');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Fetch completion statistics
   */
  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await routeCompletionService.getStats();
      setStats(data);
      return data;
    } catch (err) {
      setError(err.message);
      toast.error(err.message || 'Failed to fetch stats');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Fetch today's completions
   */
  const fetchTodayCompletions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await routeCompletionService.getTodayCompletions();
      setCompletions(data.completions || []);
      return data;
    } catch (err) {
      setError(err.message);
      toast.error(err.message || 'Failed to fetch today\'s completions');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Fetch driver-specific completions
   */
  const fetchDriverCompletions = useCallback(async (driverId, options = {}) => {
    setLoading(true);
    setError(null);
    try {
      const data = await routeCompletionService.getDriverCompletions(driverId, options);
      setCompletions(data.completions || []);
      return data;
    } catch (err) {
      setError(err.message);
      toast.error(err.message || 'Failed to fetch driver completions');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Clear current state
   */
  const clear = useCallback(() => {
    setCompletions([]);
    setStats(null);
    setError(null);
  }, []);

  return {
    // State
    loading,
    completions,
    stats,
    error,
    
    // Methods
    completeRoute,
    fetchCompletions,
    fetchStats,
    fetchTodayCompletions,
    fetchDriverCompletions,
    clear
  };
};

/**
 * Example usage:
 * 
 * const { loading, completions, completeRoute, fetchCompletions } = useRouteCompletion();
 * 
 * // Complete a route
 * await completeRoute(routeId);
 * 
 * // Fetch completions
 * await fetchCompletions({ limit: 10 });
 * 
 * // Display completions
 * completions.map(c => ...)
 */
