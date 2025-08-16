import { useState, useCallback, useEffect } from 'react';
import { shuttleService } from '@/services/shuttleService';

// Create a custom event for maintenance updates
const MAINTENANCE_UPDATE_EVENT = 'shuttle-maintenance-update';

export function useShuttleManagement() {
  const [shuttles, setShuttles] = useState([]);
  const [selectedShuttle, setSelectedShuttle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchShuttles = useCallback(async () => {
    try {
      setLoading(true);
      const data = await shuttleService.getShuttles();
      setShuttles(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchShuttles();
  }, [fetchShuttles]);

  const selectShuttle = useCallback((shuttle) => {
    setSelectedShuttle(shuttle);
  }, []);

  const addShuttle = useCallback(async (shuttleData) => {
    try {
      const newShuttle = await shuttleService.createShuttle(shuttleData);
      setShuttles(prev => [...prev, newShuttle]);
      return newShuttle;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  const updateShuttle = useCallback(async (id, updates) => {
    try {
      const updatedShuttle = await shuttleService.updateShuttle(id, updates);
      setShuttles(prev => prev.map(shuttle => 
        shuttle.id === id ? { ...shuttle, ...updatedShuttle } : shuttle
      ));
      if (selectedShuttle?.id === id) {
        setSelectedShuttle(prev => ({ ...prev, ...updatedShuttle }));
      }
      return updatedShuttle;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [selectedShuttle]);

  const deleteShuttle = useCallback(async (id) => {
    try {
      await shuttleService.deleteShuttle(id);
      setShuttles(prev => prev.filter(shuttle => shuttle.id !== id));
      if (selectedShuttle?.id === id) {
        setSelectedShuttle(null);
      }
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [selectedShuttle]);

  const updateShuttleStatus = useCallback(async (id, status) => {
    setLoading(true);
    try {
      const updatedShuttle = await shuttleService.updateShuttle(id, { status });
      // Update local state
      setShuttles(prev => prev.map(shuttle => 
        shuttle.id === id ? { ...shuttle, ...updatedShuttle } : shuttle
      ));
      if (selectedShuttle?.id === id) {
        setSelectedShuttle(prev => ({ ...prev, ...updatedShuttle }));
      }
      // Dispatch event when maintenance status changes
      window.dispatchEvent(new CustomEvent(MAINTENANCE_UPDATE_EVENT));
      return updatedShuttle;
    } catch (error) {
      console.error('Error updating status:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [selectedShuttle]);

  return {
    shuttles,
    selectedShuttle,
    loading,
    error,
    selectShuttle,
    addShuttle,
    updateShuttle,
    deleteShuttle,
    refreshShuttles: fetchShuttles,
    updateShuttleStatus,
    MAINTENANCE_UPDATE_EVENT,
  };
} 