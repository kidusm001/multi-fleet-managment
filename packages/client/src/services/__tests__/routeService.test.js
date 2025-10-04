import { routeService } from '../routeService';
import api from '../api';

jest.mock('../api');

describe('routeService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Clear cache before each test
    routeService.clearCache();
  });

  describe('getAllRoutes', () => {
    it('should fetch all routes', async () => {
      const mockRoutes = [
        { id: '1', name: 'Route A', status: 'active' },
        { id: '2', name: 'Route B', status: 'inactive' }
      ];
      api.get.mockResolvedValue({ data: mockRoutes });

      const result = await routeService.getAllRoutes();

      expect(api.get).toHaveBeenCalledWith('/routes', {
        params: { include: 'shuttle,shift,stops.employee.department' }
      });
      expect(result).toEqual(mockRoutes);
    });

    it('should use cached data when available and useCache is true', async () => {
      const mockRoutes = [{ id: '1', name: 'Route A' }];
      api.get.mockResolvedValue({ data: mockRoutes });

      // First call - should hit API
      await routeService.getAllRoutes(true);
      expect(api.get).toHaveBeenCalledTimes(1);

      // Second call - should use cache
      const result = await routeService.getAllRoutes(true);
      expect(api.get).toHaveBeenCalledTimes(1); // Still 1, not called again
      expect(result).toEqual(mockRoutes);
    });

    it('should bypass cache when useCache is false', async () => {
      const mockRoutes = [{ id: '1', name: 'Route A' }];
      api.get.mockResolvedValue({ data: mockRoutes });

      // First call with cache
      await routeService.getAllRoutes(true);
      expect(api.get).toHaveBeenCalledTimes(1);

      // Second call without cache
      await routeService.getAllRoutes(false);
      expect(api.get).toHaveBeenCalledTimes(2);
    });

    it('should refresh cache when it expires', async () => {
      const mockRoutes = [{ id: '1', name: 'Route A' }];
      api.get.mockResolvedValue({ data: mockRoutes });

      // First call
      await routeService.getAllRoutes(true);
      expect(api.get).toHaveBeenCalledTimes(1);

      // Manually expire the cache
      routeService.cache.lastFetched = Date.now() - (3 * 60 * 1000);

      // Second call should hit API again
      await routeService.getAllRoutes(true);
      expect(api.get).toHaveBeenCalledTimes(2);
    });
  });

  describe('getRouteById', () => {
    it('should fetch route by id', async () => {
      const mockRoute = { id: '1', name: 'Route A', status: 'active' };
      api.get.mockResolvedValue({ data: mockRoute });

      const result = await routeService.getRouteById('1');

      expect(api.get).toHaveBeenCalledWith('/routes/1', {
        params: { include: 'shuttle,shift,stops.employee.department' }
      });
      expect(result).toEqual(mockRoute);
    });

    it('should cache individual route data', async () => {
      const mockRoute = { id: '1', name: 'Route A' };
      api.get.mockResolvedValue({ data: mockRoute });

      // First call
      await routeService.getRouteById('1');
      expect(api.get).toHaveBeenCalledTimes(1);

      // Second call should use cache
      const result = await routeService.getRouteById('1');
      expect(api.get).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockRoute);
    });

    it('should refresh individual route cache when it expires', async () => {
      const mockRoute = { id: '1', name: 'Route A' };
      api.get.mockResolvedValue({ data: mockRoute });

      // First call
      await routeService.getRouteById('1');
      
      // Manually expire the cache
      const cacheKey = 'route_1';
      const cachedData = routeService.cache.routeDetails.get(cacheKey);
      cachedData.timestamp = Date.now() - (3 * 60 * 1000);

      // Second call should hit API again
      await routeService.getRouteById('1');
      expect(api.get).toHaveBeenCalledTimes(2);
    });
  });

  describe('getRoutesByShift', () => {
    it('should fetch routes by shift id', async () => {
      const mockRoutes = [
        { id: '1', shiftId: 1, name: 'Morning Route' },
        { id: '2', shiftId: 1, name: 'Evening Route' }
      ];
      api.get.mockResolvedValue({ data: mockRoutes });

      const result = await routeService.getRoutesByShift(1);

      expect(api.get).toHaveBeenCalledWith('/routes/shift/1', {
        params: { include: 'shuttle,stops.employee' }
      });
      expect(result).toEqual(mockRoutes);
    });
  });

  describe('createRoute', () => {
    it('should create a new route', async () => {
      const newRoute = { name: 'Route C', status: 'active' };
      const createdRoute = { id: '3', ...newRoute };
      api.post.mockResolvedValue({ data: createdRoute });

      const result = await routeService.createRoute(newRoute);

      expect(api.post).toHaveBeenCalledWith('/routes', newRoute);
      expect(result).toEqual(createdRoute);
    });

    it('should clear cache after creating route', async () => {
      const mockRoutes = [{ id: '1', name: 'Route A' }];
      const newRoute = { name: 'Route B' };
      
      api.get.mockResolvedValue({ data: mockRoutes });
      api.post.mockResolvedValue({ data: { id: '2', ...newRoute } });

      // Populate cache
      await routeService.getAllRoutes();
      expect(api.get).toHaveBeenCalledTimes(1);

      // Create route - should clear cache
      await routeService.createRoute(newRoute);

      // Next fetch should hit API again
      await routeService.getAllRoutes(true);
      expect(api.get).toHaveBeenCalledTimes(2);
    });
  });

  describe('updateRoute', () => {
    it('should update an existing route', async () => {
      const updates = { 
        name: 'Updated Route',
        totalDistance: 15.567,
        totalTime: 45.8
      };
      const updatedRoute = { id: '1', name: 'Updated Route', totalDistance: 15.57, totalTime: 46 };
      api.put.mockResolvedValue({ data: updatedRoute });

      const result = await routeService.updateRoute('1', updates);

      expect(api.put).toHaveBeenCalledWith('/routes/1', {
        name: 'Updated Route',
        totalDistance: 15.57,
        totalTime: 46
      });
      expect(result).toEqual(updatedRoute);
    });

    it('should round totalTime and fix totalDistance precision', async () => {
      const updates = {
        totalDistance: 12.34567,
        totalTime: 34.789
      };
      api.put.mockResolvedValue({ data: updates });

      await routeService.updateRoute('1', updates);

      expect(api.put).toHaveBeenCalledWith('/routes/1', {
        totalDistance: 12.35,
        totalTime: 35
      });
    });
  });

  describe('updateRouteStatus', () => {
    it('should update route status', async () => {
      const response = { message: 'Status updated' };
      api.patch.mockResolvedValue({ data: response });

      const result = await routeService.updateRouteStatus('1', 'INACTIVE');

      expect(api.patch).toHaveBeenCalledWith('/routes/1/status', { status: 'INACTIVE' });
      expect(result).toEqual(response);
    });

    it('should update status in cache', async () => {
      const mockRoutes = [{ id: '1', status: 'ACTIVE' }];
      
      api.get.mockResolvedValue({ data: mockRoutes });
      api.patch.mockResolvedValue({ data: { message: 'Updated' } });

      // Populate cache
      await routeService.getAllRoutes();
      
      // Update status
      await routeService.updateRouteStatus('1', 'INACTIVE');

      // Check cache was updated
      expect(routeService.cache.routes[0].status).toBe('INACTIVE');
    });
  });

  describe('deleteRoute', () => {
    it('should delete a route', async () => {
      api.delete.mockResolvedValue({ data: {} });

      await routeService.deleteRoute('1');

      expect(api.delete).toHaveBeenCalledWith('/routes/1');
    });

    it('should remove route from cache after deletion', async () => {
      const mockRoutes = [
        { id: '1', name: 'Route A' },
        { id: '2', name: 'Route B' }
      ];
      
      api.get.mockResolvedValue({ data: mockRoutes });
      api.delete.mockResolvedValue({ data: {} });

      // Populate cache
      await routeService.getAllRoutes();
      expect(routeService.cache.routes).toHaveLength(2);
      
      // Delete route
      await routeService.deleteRoute('1');

      // Check cache was updated
      expect(routeService.cache.routes).toHaveLength(1);
      expect(routeService.cache.routes[0].id).toBe('2');
    });
  });

  describe('getRouteStops', () => {
    it('should fetch route stops', async () => {
      const mockStops = [
        { id: 1, routeId: '1', order: 1 },
        { id: 2, routeId: '1', order: 2 }
      ];
      api.get.mockResolvedValue({ data: mockStops });

      const result = await routeService.getRouteStops('1');

      expect(api.get).toHaveBeenCalledWith('/routes/1/stops', {
        params: { include: 'employee.department' }
      });
      expect(result).toEqual(mockStops);
    });
  });

  describe('updateRouteStops', () => {
    it('should update route stops', async () => {
      const stops = [
        { id: 1, order: 1 },
        { id: 2, order: 2 }
      ];
      api.put.mockResolvedValue({ data: stops });

      const result = await routeService.updateRouteStops('1', stops);

      expect(api.put).toHaveBeenCalledWith('/routes/1/stops', { stops });
      expect(result).toEqual(stops);
    });

    it('should invalidate route cache after updating stops', async () => {
      const stops = [{ id: 1, order: 1 }];
      
      api.get.mockResolvedValue({ data: { id: '1', stops: [] } });
      api.put.mockResolvedValue({ data: stops });

      // Populate cache
      await routeService.getRouteById('1');
      expect(api.get).toHaveBeenCalledTimes(1);

      // Update stops
      await routeService.updateRouteStops('1', stops);

      // Next fetch should hit API
      await routeService.getRouteById('1');
      expect(api.get).toHaveBeenCalledTimes(2);
    });
  });

  describe('getRoutesWithUniqueLocations', () => {
    it('should fetch routes with unique locations', async () => {
      const mockRoutes = [
        { id: '1', locations: ['Location A', 'Location B'] },
        { id: '2', locations: ['Location C'] }
      ];
      api.get.mockResolvedValue({ data: mockRoutes });

      const result = await routeService.getRoutesWithUniqueLocations();

      expect(api.get).toHaveBeenCalledWith('/routes/unique-locations');
      expect(result).toEqual(mockRoutes);
    });
  });

  describe('validateRouteTimeWindow', () => {
    it('should validate route time window', async () => {
      const validation = { valid: true };
      api.post.mockResolvedValue({ data: validation });

      const params = {
        shuttleId: 'shuttle1',
        startTime: '08:00',
        endTime: '17:00',
        routeId: 'route1'
      };

      const result = await routeService.validateRouteTimeWindow(params);

      expect(api.post).toHaveBeenCalledWith('/routes/validate-time-window', params);
      expect(result).toEqual(validation);
    });

    it('should return validation error when time window conflicts', async () => {
      const validation = { valid: false, error: 'Time window conflict' };
      api.post.mockResolvedValue({ data: validation });

      const params = {
        shuttleId: 'shuttle1',
        startTime: '08:00',
        endTime: '17:00'
      };

      const result = await routeService.validateRouteTimeWindow(params);

      expect(result).toEqual(validation);
    });
  });

  describe('removeEmployeeFromRoute', () => {
    it('should remove employee from route', async () => {
      const employeeData = {
        routeId: 'route1',
        employee: { id: 'emp1' },
        totalDistance: 25.5,
        totalTime: 60
      };
      api.patch.mockResolvedValue({ data: { success: true } });

      const result = await routeService.removeEmployeeFromRoute(employeeData);

      expect(api.patch).toHaveBeenCalledWith(
        '/routes/route1/employees/emp1/remove-stop',
        { totalDistance: 25.5, totalTime: 60 }
      );
      expect(result).toEqual({ success: true });
    });

    it('should throw error when routeId is missing', async () => {
      const employeeData = {
        employee: { id: 'emp1' },
        totalDistance: 25.5,
        totalTime: 60
      };

      await expect(routeService.removeEmployeeFromRoute(employeeData))
        .rejects.toThrow('Route ID and Employee ID are required');
    });

    it('should throw error when employee id is missing', async () => {
      const employeeData = {
        routeId: 'route1',
        employee: {},
        totalDistance: 25.5,
        totalTime: 60
      };

      await expect(routeService.removeEmployeeFromRoute(employeeData))
        .rejects.toThrow('Route ID and Employee ID are required');
    });

    it('should invalidate cache after removing employee', async () => {
      const employeeData = {
        routeId: 'route1',
        employee: { id: 'emp1' },
        totalDistance: 25.5,
        totalTime: 60
      };
      
      api.get.mockResolvedValue({ data: { id: 'route1' } });
      api.patch.mockResolvedValue({ data: { success: true } });

      // Populate cache
      await routeService.getRouteById('route1');
      expect(api.get).toHaveBeenCalledTimes(1);

      // Remove employee
      await routeService.removeEmployeeFromRoute(employeeData);

      // Next fetch should hit API
      await routeService.getRouteById('route1');
      expect(api.get).toHaveBeenCalledTimes(2);
    });
  });

  describe('addEmployeeToRoute', () => {
    it('should add employee to route', async () => {
      const routeMetrics = { totalDistance: 30.5, totalTime: 75 };
      api.patch.mockResolvedValue({ data: { success: true } });

      const result = await routeService.addEmployeeToRoute('route1', 'c1234567890abcdefghijklmno', routeMetrics);

      expect(api.patch).toHaveBeenCalledWith(
        '/routes/route1/employees/c1234567890abcdefghijklmno/add-stop',
        routeMetrics
      );
      expect(result).toEqual({ success: true });
    });

    it('should throw error when routeId is missing', async () => {
      await expect(routeService.addEmployeeToRoute('', 'emp1', {}))
        .rejects.toThrow('Route ID and Employee ID are required');
    });

    it('should throw error when employeeId is missing', async () => {
      await expect(routeService.addEmployeeToRoute('route1', '', {}))
        .rejects.toThrow('Route ID and Employee ID are required');
    });

    it('should throw error when routeId is NaN', async () => {
      await expect(routeService.addEmployeeToRoute('NaN', 'emp1', {}))
        .rejects.toThrow('Invalid route ID');
    });

    it('should throw error when employeeId format is invalid', async () => {
      await expect(routeService.addEmployeeToRoute('route1', 'invalid-id', {}))
        .rejects.toThrow('Invalid employee ID format');
    });

    it('should handle API errors with descriptive messages', async () => {
      api.patch.mockRejectedValue({
        response: {
          data: {
            error: 'Employee already in route'
          }
        }
      });

      await expect(routeService.addEmployeeToRoute('route1', 'c1234567890abcdefghijklmno', {}))
        .rejects.toThrow('Employee already in route');
    });

    it('should invalidate cache after adding employee', async () => {
      api.get.mockResolvedValue({ data: { id: 'route1' } });
      api.patch.mockResolvedValue({ data: { success: true } });

      // Populate cache
      await routeService.getRouteById('route1');
      expect(api.get).toHaveBeenCalledTimes(1);

      // Add employee
      await routeService.addEmployeeToRoute('route1', 'c1234567890abcdefghijklmno', {});

      // Next fetch should hit API
      await routeService.getRouteById('route1');
      expect(api.get).toHaveBeenCalledTimes(2);
    });
  });

  describe('Cache management', () => {
    it('should clear all caches', async () => {
      const mockRoutes = [{ id: '1', name: 'Route A' }];
      api.get.mockResolvedValue({ data: mockRoutes });

      // Populate cache
      await routeService.getAllRoutes();
      await routeService.getRouteById('1');

      expect(routeService.cache.routes).not.toBeNull();
      expect(routeService.cache.routeDetails.size).toBeGreaterThan(0);

      // Clear cache
      routeService.clearCache();

      expect(routeService.cache.routes).toBeNull();
      expect(routeService.cache.lastFetched).toBeNull();
      expect(routeService.cache.routeDetails.size).toBe(0);
    });

    it('should clear specific route cache', async () => {
      api.get.mockResolvedValue({ 
        data: [
          { id: '1', name: 'Route 1' },
          { id: '2', name: 'Route 2' }
        ]
      });

      // Populate cache
      await routeService.getAllRoutes();
      await routeService.getRouteById('1');

      expect(routeService.cache.routes).toHaveLength(2);
      expect(routeService.cache.routeDetails.has('route_1')).toBe(true);

      // Clear specific route
      routeService.clearRouteCache('1');

      // Main cache should not contain route 1
      expect(routeService.cache.routes).toHaveLength(1);
      expect(routeService.cache.routes[0].id).toBe('2');
      expect(routeService.cache.routeDetails.has('route_1')).toBe(false);
    });
  });
});
