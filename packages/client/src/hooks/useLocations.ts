import { useState, useEffect, useCallback } from 'react';
import { authClient } from '@/lib/auth-client';
import { locationService } from '@/services/locationService';
import { toast } from 'sonner';

interface Location {
  id: string;
  address: string;
  latitude: number;
  longitude: number;
  type: 'BRANCH' | 'HQ';
  _count?: {
    employees: number;
    routes: number;
  };
}

interface UseLocationsReturn {
  locations: Location[];
  loading: boolean;
  error: string | null;
  loadLocations: () => Promise<void>;
  createLocation: (data: Omit<Location, 'id' | '_count'>) => Promise<void>;
  updateLocation: (id: string, data: Omit<Location, 'id' | '_count'>) => Promise<void>;
  deleteLocation: (id: string) => Promise<void>;
  isOrgReady: boolean;
}

/**
 * Custom hook to manage location data fetching and operations
 * Handles organization switching, caching, and async patterns
 */
export function useLocations(): UseLocationsReturn {
  const { useActiveOrganization } = authClient;
  const { data: activeOrg, isPending: orgLoading } = useActiveOrganization();
  
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentOrgId, setCurrentOrgId] = useState<string | null>(null);
  const [forceRefresh, setForceRefresh] = useState(0);

  // Determine if organization context is ready
  const isOrgReady = !orgLoading && !!activeOrg?.id;

  // Load locations when organization changes
  useEffect(() => {
    // Don't proceed if organization is still loading
    if (orgLoading) {
      return;
    }

    if (activeOrg?.id) {
      // If organization changed, clear cache and reload
      if (currentOrgId && currentOrgId !== activeOrg.id) {
        locationService.clearCache();
        setLocations([]);
        setError(null);
        setForceRefresh(prev => prev + 1);
      }
      
      if (currentOrgId !== activeOrg.id) {
        setCurrentOrgId(activeOrg.id);
      }
      
      loadLocations();
    } else if (activeOrg === null && !orgLoading) {
      // No active organization and not loading, clear data
      setLocations([]);
      setCurrentOrgId(null);
      setLoading(false);
      setError('No active organization selected');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeOrg?.id, currentOrgId, orgLoading, forceRefresh]);

  const loadLocations = useCallback(async () => {
    const currentActiveOrgId = activeOrg?.id;
    
    if (!currentActiveOrgId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // Add a small delay to ensure backend session is updated
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const data = await locationService.getLocations();
      
      // Double-check we're still on the same organization
      if (activeOrg?.id === currentActiveOrgId) {
        setLocations(data);
      }
    } catch (err) {
      console.error('Failed to load locations:', err);
      setError('Failed to load locations');
      toast.error('Failed to load locations');
    } finally {
      setLoading(false);
    }
  }, [activeOrg?.id]);

  const createLocation = useCallback(async (data: Omit<Location, 'id' | '_count'>) => {
    try {
      await locationService.createLocation(data);
      toast.success('Location created successfully');
      await loadLocations();
    } catch (err) {
      console.error('Failed to create location:', err);
      toast.error('Failed to create location');
      throw err;
    }
  }, [loadLocations]);

  const updateLocation = useCallback(async (id: string, data: Omit<Location, 'id' | '_count'>) => {
    try {
      await locationService.updateLocation(id, data);
      toast.success('Location updated successfully');
      await loadLocations();
    } catch (err) {
      console.error('Failed to update location:', err);
      toast.error('Failed to update location');
      throw err;
    }
  }, [loadLocations]);

  const deleteLocation = useCallback(async (id: string) => {
    try {
      await locationService.deleteLocation(id);
      toast.success('Location deleted successfully');
      await loadLocations();
    } catch (err: unknown) {
      console.error('Failed to delete location:', err);
      const error = err as { response?: { status?: number } };
      if (error.response?.status === 400) {
        toast.error('Cannot delete location with active employees or routes');
      } else {
        toast.error('Failed to delete location');
      }
      throw err;
    }
  }, [loadLocations]);

  const refreshLocations = useCallback(() => {
    locationService.clearCache();
    setForceRefresh(prev => prev + 1);
    return loadLocations();
  }, [loadLocations]);

  return {
    locations,
    loading,
    error,
    loadLocations: refreshLocations,
    createLocation,
    updateLocation,
    deleteLocation,
    isOrgReady,
  };
}
