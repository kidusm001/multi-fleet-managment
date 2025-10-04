import { renderHook, waitFor } from '@testing-library/react';
import { act } from 'react';
import { useLocations } from '../useLocations';
import { locationService } from '@/services/locationService';
import { toast } from 'sonner';

// Create a mock hook that can be controlled
const mockUseActiveOrganization = jest.fn();

// Mock dependencies
jest.mock('@/lib/auth-client', () => ({
  authClient: {
    useActiveOrganization: () => mockUseActiveOrganization(),
  },
}));

jest.mock('@/services/locationService', () => ({
  locationService: {
    getLocations: jest.fn(),
    createLocation: jest.fn(),
    updateLocation: jest.fn(),
    deleteLocation: jest.fn(),
    clearCache: jest.fn(),
  },
}));

jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

const mockGetLocations = locationService.getLocations as jest.Mock;
const mockCreateLocation = locationService.createLocation as jest.Mock;
const mockUpdateLocation = locationService.updateLocation as jest.Mock;
const mockDeleteLocation = locationService.deleteLocation as jest.Mock;
const mockClearCache = locationService.clearCache as jest.Mock;

describe('useLocations Hook - Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Default: no organization loaded
    mockUseActiveOrganization.mockReturnValue({
      data: null,
      isLoading: true,
    });
    // Default: return empty array for getLocations
    mockGetLocations.mockResolvedValue([]);
  });

  describe('Organization Context Integration', () => {
    it('should load locations when organization is ready', async () => {
      const mockLocations = [
        { id: '1', address: 'Location 1', latitude: 9.0, longitude: 38.0, type: 'BRANCH' },
      ];
      
      mockUseActiveOrganization.mockReturnValue({
        data: { id: 'org1', name: 'Org 1' },
        isLoading: false,
      });
      
      mockGetLocations.mockResolvedValue(mockLocations);

      const { result } = renderHook(() => useLocations());

      expect(result.current.loading).toBe(true);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.locations).toEqual(mockLocations);
      expect(result.current.isOrgReady).toBe(true);
      expect(mockGetLocations).toHaveBeenCalled(); // Called at least once
    });

    it('should wait for organization to load before fetching locations', async () => {
      mockUseActiveOrganization.mockReturnValue({
        data: null,
        isLoading: true,
      });

      const { result } = renderHook(() => useLocations());

      expect(result.current.isOrgReady).toBe(false);
      expect(mockGetLocations).not.toHaveBeenCalled();
    });

    it('should show error when no active organization', async () => {
      mockUseActiveOrganization.mockReturnValue({
        data: null,
        isLoading: false,
      });

      const { result } = renderHook(() => useLocations());

      await waitFor(() => {
        expect(result.current.error).toBe('No active organization selected');
      });

      expect(result.current.locations).toEqual([]);
      expect(result.current.isOrgReady).toBe(false);
    });

    it('should clear and reload locations when organization changes', async () => {
      const org1Locations = [
        { id: '1', address: 'Org 1 Location', latitude: 9.0, longitude: 38.0, type: 'BRANCH' },
      ];
      
      const org2Locations = [
        { id: '2', address: 'Org 2 Location', latitude: 9.1, longitude: 38.1, type: 'HQ' },
      ];

      // Start with org1
      mockUseActiveOrganization.mockReturnValue({
        data: { id: 'org1', name: 'Org 1' },
        isLoading: false,
      });
      
      mockGetLocations.mockResolvedValue(org1Locations);

      const { result, rerender } = renderHook(() => useLocations());

      await waitFor(() => {
        expect(result.current.locations).toEqual(org1Locations);
      });

      // Switch to org2
      mockUseActiveOrganization.mockReturnValue({
        data: { id: 'org2', name: 'Org 2' },
        isLoading: false,
      });
      
      mockGetLocations.mockResolvedValue(org2Locations);

      rerender();

      await waitFor(() => {
        expect(mockClearCache).toHaveBeenCalled();
        expect(result.current.locations).toEqual(org2Locations);
      });

      // Should have called getLocations for both orgs (at least 2 times)
      expect(mockGetLocations.mock.calls.length).toBeGreaterThanOrEqual(2);
    });

    it('should handle async timing during organization switch', async () => {
      mockUseActiveOrganization.mockReturnValue({
        data: { id: 'org1', name: 'Org 1' },
        isLoading: false,
      });

      let resolveGetLocations: (value: unknown) => void;
      const getLocationsPromise = new Promise((resolve) => {
        resolveGetLocations = resolve;
      });
      
      mockGetLocations.mockReturnValue(getLocationsPromise);

      const { result, rerender } = renderHook(() => useLocations());

      expect(result.current.loading).toBe(true);

      // Switch organization before previous fetch completes
      mockUseActiveOrganization.mockReturnValue({
        data: { id: 'org2', name: 'Org 2' },
        isLoading: false,
      });

      rerender();

      // Resolve the old fetch
      await act(async () => {
        resolveGetLocations!([{ id: '1', address: 'Old Location' }]);
      });

      // Should not set old locations since org changed
      await waitFor(() => {
        expect(result.current.loading).toBe(true); // Still loading for org2
      });
    });
  });

  describe('CRUD Operations Integration', () => {
    beforeEach(() => {
      mockUseActiveOrganization.mockReturnValue({
        data: { id: 'org1', name: 'Org 1' },
        isLoading: false,
      });
    });

    it('should create location and reload list', async () => {
      const existingLocations = [
        { id: '1', address: 'Location 1', latitude: 9.0, longitude: 38.0, type: 'BRANCH' },
      ];
      
      const newLocation = {
        address: 'New Location',
        latitude: 9.1,
        longitude: 38.1,
        type: 'HQ' as const,
      };

      mockGetLocations.mockResolvedValue(existingLocations);
      mockCreateLocation.mockResolvedValue({ id: '2', ...newLocation });

      const { result } = renderHook(() => useLocations());

      await waitFor(() => {
        expect(result.current.locations).toEqual(existingLocations);
      });

      // Update mock to return new list after create
      mockGetLocations.mockResolvedValue([
        ...existingLocations,
        { id: '2', ...newLocation },
      ]);

      await act(async () => {
        await result.current.createLocation(newLocation);
      });

      expect(mockCreateLocation).toHaveBeenCalledWith(newLocation);
      expect(toast.success).toHaveBeenCalledWith('Location created successfully');
      
      await waitFor(() => {
        expect(result.current.locations).toHaveLength(2);
      });
    });

    it('should update location and reload list', async () => {
      const locations = [
        { id: '1', address: 'Old Address', latitude: 9.0, longitude: 38.0, type: 'BRANCH' },
      ];

      mockGetLocations.mockResolvedValue(locations);

      const { result } = renderHook(() => useLocations());

      await waitFor(() => {
        expect(result.current.locations).toEqual(locations);
      });

      const updatedData = {
        address: 'New Address',
        latitude: 9.1,
        longitude: 38.1,
        type: 'HQ' as const,
      };

      mockUpdateLocation.mockResolvedValue({});
      mockGetLocations.mockResolvedValue([
        { id: '1', ...updatedData },
      ]);

      await act(async () => {
        await result.current.updateLocation('1', updatedData);
      });

      expect(mockUpdateLocation).toHaveBeenCalledWith('1', updatedData);
      expect(toast.success).toHaveBeenCalledWith('Location updated successfully');
      
      await waitFor(() => {
        expect(result.current.locations[0].address).toBe('New Address');
      });
    });

    it('should delete location and reload list', async () => {
      const locations = [
        { id: '1', address: 'Location 1', latitude: 9.0, longitude: 38.0, type: 'BRANCH' },
        { id: '2', address: 'Location 2', latitude: 9.1, longitude: 38.1, type: 'HQ' },
      ];

      mockGetLocations.mockResolvedValue(locations);

      const { result } = renderHook(() => useLocations());

      await waitFor(() => {
        expect(result.current.locations).toHaveLength(2);
      });

      mockDeleteLocation.mockResolvedValue({});
      mockGetLocations.mockResolvedValue([locations[1]]);

      await act(async () => {
        await result.current.deleteLocation('1');
      });

      expect(mockDeleteLocation).toHaveBeenCalledWith('1');
      expect(toast.success).toHaveBeenCalledWith('Location deleted successfully');
      
      await waitFor(() => {
        expect(result.current.locations).toHaveLength(1);
      });
    });

    it('should handle delete error for location with dependencies', async () => {
      const locations = [
        { id: '1', address: 'Location 1', latitude: 9.0, longitude: 38.0, type: 'BRANCH' },
      ];

      mockGetLocations.mockResolvedValue(locations);

      const { result } = renderHook(() => useLocations());

      await waitFor(() => {
        expect(result.current.locations).toHaveLength(1);
      });

      const error = { response: { status: 400 } };
      mockDeleteLocation.mockRejectedValue(error);

      await act(async () => {
        try {
          await result.current.deleteLocation('1');
        } catch {
          // Expected to throw
        }
      });

      expect(toast.error).toHaveBeenCalledWith(
        'Cannot delete location with active employees or routes'
      );
    });
  });

  describe('Error Handling Integration', () => {
    beforeEach(() => {
      mockUseActiveOrganization.mockReturnValue({
        data: { id: 'org1', name: 'Org 1' },
        isLoading: false,
      });
    });

    it('should handle location fetch errors', async () => {
      mockGetLocations.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useLocations());

      await waitFor(() => {
        expect(result.current.error).toBe('Failed to load locations');
        expect(result.current.loading).toBe(false);
      });

      expect(toast.error).toHaveBeenCalledWith('Failed to load locations');
    });

    it('should handle create location errors', async () => {
      mockGetLocations.mockResolvedValue([]);

      const { result } = renderHook(() => useLocations());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      mockCreateLocation.mockRejectedValue(new Error('Create failed'));

      await act(async () => {
        try {
          await result.current.createLocation({
            address: 'Test',
            latitude: 9.0,
            longitude: 38.0,
            type: 'BRANCH',
          });
        } catch {
          // Expected to throw
        }
      });

      expect(toast.error).toHaveBeenCalledWith('Failed to create location');
    });

    it('should handle update location errors', async () => {
      mockGetLocations.mockResolvedValue([
        { id: '1', address: 'Test', latitude: 9.0, longitude: 38.0, type: 'BRANCH' },
      ]);

      const { result } = renderHook(() => useLocations());

      await waitFor(() => {
        expect(result.current.locations).toHaveLength(1);
      });

      mockUpdateLocation.mockRejectedValue(new Error('Update failed'));

      await act(async () => {
        try {
          await result.current.updateLocation('1', {
            address: 'Updated',
            latitude: 9.1,
            longitude: 38.1,
            type: 'HQ',
          });
        } catch {
          // Expected to throw
        }
      });

      expect(toast.error).toHaveBeenCalledWith('Failed to update location');
    });
  });

  describe('Cache Management Integration', () => {
    it('should refresh locations and clear cache', async () => {
      mockUseActiveOrganization.mockReturnValue({
        data: { id: 'org1', name: 'Org 1' },
        isLoading: false,
      });

      const initialLocations = [
        { id: '1', address: 'Location 1', latitude: 9.0, longitude: 38.0, type: 'BRANCH' },
      ];

      mockGetLocations.mockResolvedValue(initialLocations);

      const { result } = renderHook(() => useLocations());

      await waitFor(() => {
        expect(result.current.locations).toEqual(initialLocations);
      });

      const updatedLocations = [
        { id: '1', address: 'Updated Location', latitude: 9.0, longitude: 38.0, type: 'BRANCH' },
      ];

      mockGetLocations.mockResolvedValue(updatedLocations);

      await act(async () => {
        await result.current.loadLocations();
      });

      expect(mockClearCache).toHaveBeenCalled();
      
      await waitFor(() => {
        expect(result.current.locations).toEqual(updatedLocations);
      });
    });
  });
});
