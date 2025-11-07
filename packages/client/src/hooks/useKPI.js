import { useState, useCallback, useEffect } from 'react';

/**
 * Custom hook for fetching KPI dashboard data
 * @param {string} organizationId - Organization ID
 * @param {Date} startDate - Start date for KPI calculation
 * @param {Date} endDate - End date for KPI calculation
 * @returns {Object} Dashboard data, loading state, and error
 */
export const useKPIDashboard = (organizationId, startDate, endDate) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchDashboard = useCallback(async () => {
    if (!organizationId || !startDate || !endDate) {
      return;
    }

    try {
      setLoading(true);
      const start = startDate.toISOString().split('T')[0];
      const end = endDate.toISOString().split('T')[0];

      const response = await fetch(
        `/api/kpi/dashboard?organizationId=${organizationId}&startDate=${start}&endDate=${end}`
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      setData(result);
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error('useKPIDashboard error:', err);
    } finally {
      setLoading(false);
    }
  }, [organizationId, startDate, endDate]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  return { data, loading, error, refetch: fetchDashboard };
};

/**
 * Custom hook for fetching KPI trends
 * @param {string} organizationId - Organization ID
 * @param {Date} startDate - Start date for KPI calculation
 * @param {Date} endDate - End date for KPI calculation
 * @param {string} interval - Interval: 'daily', 'weekly', 'monthly'
 * @param {string} dimensionType - Optional: type of dimension to filter by
 * @param {string} dimensionId - Optional: ID of the specific dimension
 * @returns {Object} Trends data, loading state, and error
 */
export const useKPITrends = (organizationId, startDate, endDate, interval = 'daily', dimensionType = null, dimensionId = null) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchTrends = useCallback(async () => {
    if (!organizationId || !startDate || !endDate) {
      return;
    }

    try {
      setLoading(true);
      const start = startDate.toISOString().split('T')[0];
      const end = endDate.toISOString().split('T')[0];

      let url = `/api/kpi/trends?organizationId=${organizationId}&startDate=${start}&endDate=${end}&interval=${interval}`;
      
      if (dimensionType && dimensionId) {
        url += `&dimensionType=${dimensionType}&dimensionId=${dimensionId}`;
      }

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      setData(result);
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error('useKPITrends error:', err);
    } finally {
      setLoading(false);
    }
  }, [organizationId, startDate, endDate, interval, dimensionType, dimensionId]);

  useEffect(() => {
    fetchTrends();
  }, [fetchTrends]);

  return { data, loading, error, refetch: fetchTrends };
};

/**
 * Custom hook for fetching KPI comparisons
 * @param {string} organizationId - Organization ID
 * @param {Date} currentStartDate - Current period start date
 * @param {Date} currentEndDate - Current period end date
 * @param {Date} previousStartDate - Previous period start date
 * @param {Date} previousEndDate - Previous period end date
 * @returns {Object} Comparison data, loading state, and error
 */
export const useKPIComparison = (organizationId, currentStartDate, currentEndDate, previousStartDate, previousEndDate) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchComparison = useCallback(async () => {
    if (!organizationId || !currentStartDate || !currentEndDate || !previousStartDate || !previousEndDate) {
      return;
    }

    try {
      setLoading(true);
      const currentStart = currentStartDate.toISOString().split('T')[0];
      const currentEnd = currentEndDate.toISOString().split('T')[0];
      const prevStart = previousStartDate.toISOString().split('T')[0];
      const prevEnd = previousEndDate.toISOString().split('T')[0];

      const response = await fetch(
        `/api/kpi/compare?organizationId=${organizationId}&currentStartDate=${currentStart}&currentEndDate=${currentEnd}&previousStartDate=${prevStart}&previousEndDate=${prevEnd}`
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      setData(result);
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error('useKPIComparison error:', err);
    } finally {
      setLoading(false);
    }
  }, [organizationId, currentStartDate, currentEndDate, previousStartDate, previousEndDate]);

  useEffect(() => {
    fetchComparison();
  }, [fetchComparison]);

  return { data, loading, error, refetch: fetchComparison };
};

/**
 * Custom hook for fetching dimension-specific KPI
 * @param {string} organizationId - Organization ID
 * @param {string} dimensionType - Type: 'department', 'shift', 'route', 'vehicle_category', 'location', 'datetime'
 * @param {Date} startDate - Start date for KPI calculation
 * @param {Date} endDate - End date for KPI calculation
 * @returns {Object} Dimension data, loading state, and error
 */
export const useKPIDimension = (organizationId, dimensionType, startDate, endDate) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchDimension = useCallback(async () => {
    if (!organizationId || !dimensionType || !startDate || !endDate) {
      return;
    }

    try {
      setLoading(true);
      const start = startDate.toISOString().split('T')[0];
      const end = endDate.toISOString().split('T')[0];

      const dimensionEndpoints = {
        department: 'department',
        shift: 'shift',
        route: 'route',
        vehicle_category: 'vehicle-category',
        location: 'location',
        datetime: 'datetime'
      };

      const endpoint = dimensionEndpoints[dimensionType];
      if (!endpoint) {
        throw new Error(`Unknown dimension type: ${dimensionType}`);
      }

      const response = await fetch(
        `/api/kpi/${endpoint}?organizationId=${organizationId}&startDate=${start}&endDate=${end}`
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      setData(result);
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error(`useKPIDimension (${dimensionType}) error:`, err);
    } finally {
      setLoading(false);
    }
  }, [organizationId, dimensionType, startDate, endDate]);

  useEffect(() => {
    fetchDimension();
  }, [fetchDimension]);

  return { data, loading, error, refetch: fetchDimension };
};

export default {
  useKPIDashboard,
  useKPITrends,
  useKPIComparison,
  useKPIDimension
};
