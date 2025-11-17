import { locationService } from '../locationService';

// Mock the api module
jest.mock('../api', () => ({
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
}));

import api from '../api';

describe('LocationService', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    locationService.clearCache();
  });

  describe('getLocations', () => {
    it('should fetch locations successfully', async () => {
      const mockLocations = [
        {
          id: '1',
          address: 'Test Location 1',
          latitude: 9.0221,
          longitude: 38.7468,
          type: 'BRANCH',
          _count: { employees: 5, routes: 2 }
        }
      ];

      api.get.mockResolvedValue({ data: mockLocations });

      const result = await locationService.getLocations();

      expect(api.get).toHaveBeenCalledWith('/locations', { params: {} });
      expect(result).toEqual(mockLocations);
    });

    it('should filter by type when provided', async () => {
      const mockLocations = [];
      api.get.mockResolvedValue({ data: mockLocations });

      await locationService.getLocations('BRANCH');

      expect(api.get).toHaveBeenCalledWith('/locations', { params: { type: 'BRANCH' } });
    });

    it('should use cache for subsequent requests', async () => {
      const mockLocations = [{ id: '1', address: 'Test' }];
      api.get.mockResolvedValue({ data: mockLocations });

      // First call
      await locationService.getLocations();
      
      // Second call should use cache
      const result = await locationService.getLocations();

      expect(api.get).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockLocations);
    });
  });

  describe('createLocation', () => {
    it('should create location and clear cache', async () => {
      const locationData = {
        address: 'New Location',
        latitude: 9.0221,
        longitude: 38.7468,
        type: 'BRANCH'
      };
      const mockResponse = { id: '1', ...locationData };

      api.post.mockResolvedValue({ data: mockResponse });

      const result = await locationService.createLocation(locationData);

      expect(api.post).toHaveBeenCalledWith('/locations', locationData);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('updateLocation', () => {
    it('should update location and clear cache', async () => {
      const locationId = '1';
      const updateData = { address: 'Updated Location' };
      const mockResponse = { id: locationId, ...updateData };

      api.put.mockResolvedValue({ data: mockResponse });

      const result = await locationService.updateLocation(locationId, updateData);

      expect(api.put).toHaveBeenCalledWith(`/locations/${locationId}`, updateData);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('deleteLocation', () => {
    it('should delete location and clear cache', async () => {
      const locationId = '1';
      const mockResponse = { message: 'Location deleted successfully' };

      api.delete.mockResolvedValue({ data: mockResponse });

      const result = await locationService.deleteLocation(locationId);

      expect(api.delete).toHaveBeenCalledWith(`/locations/${locationId}`);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('TYPES constant', () => {
    it('should have correct location types', () => {
      expect(locationService.constructor.TYPES).toEqual({
        BRANCH: 'BRANCH',
        HQ: 'HQ'
      });
    });
  });
});