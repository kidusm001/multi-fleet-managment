import { useState, useEffect, useCallback } from 'react';
import { shuttleService } from '@/services/shuttleService';

export const useShuttleManagement = () => {
  const [shuttles, setShuttles] = useState([]);
  const [selectedShuttle, setSelectedShuttle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refreshShuttles = useCallback(async () => {
    try {
      setLoading(true);
      // The service now handles caching internally
      const data = await shuttleService.getShuttles();
      setShuttles(data);
      
      // Update selected shuttle data if one is selected
      if (selectedShuttle) {
        const updatedShuttle = data.find(s => s.id === selectedShuttle.id);
        setSelectedShuttle(updatedShuttle || null);
      }
    } catch (err) {
      setError(err.message);
      console.error('Error fetching shuttles:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedShuttle]);

  // Only fetch on mount
  useEffect(() => {
    refreshShuttles();
  }, []);

  const addShuttle = async (shuttleData) => {
    try {
      await shuttleService.createShuttle(shuttleData);
      await refreshShuttles(true); // Force refresh after add
    } catch (err) {
      console.error('Error adding shuttle:', err);
      throw err;
    }
  };

  const deleteShuttle = async (id) => {
    try {
      await shuttleService.deleteShuttle(id);
      setSelectedShuttle(null);
      await refreshShuttles(true); // Force refresh after delete
    } catch (err) {
      console.error('Error deleting shuttle:', err);
      throw err;
    }
  };

  const selectShuttle = (shuttle) => {
    setSelectedShuttle(shuttle);
  };

  return {
    shuttles,
    selectedShuttle,
    loading,
    error,
    refreshShuttles,
    addShuttle,
    deleteShuttle,
    selectShuttle,
  };
};