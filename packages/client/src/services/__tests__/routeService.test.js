import { routeService } from '../routeService';
import api from '../api';

jest.mock('../api');

describe('routeService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
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
  });

  describe('deleteRoute', () => {
    it('should delete a route', async () => {
      api.delete.mockResolvedValue({ data: {} });

      await routeService.deleteRoute('1');

      expect(api.delete).toHaveBeenCalledWith('/routes/1');
    });
  });
});
