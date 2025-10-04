/**
 * API Layer Integration Tests
 * 
 * Strategy: Test API client configuration, error handling, and interceptor behavior
 * using axios-mock-adapter to simulate real HTTP responses without hitting a live server.
 * 
 * Coverage Goals:
 * - Axios instance configuration (baseURL, headers, credentials)
 * - Response interceptor error handling (401 redirects, 403 handling, network errors)
 * - API endpoint structure and parameter validation
 * - Integration with authentication and session management
 */

import MockAdapter from 'axios-mock-adapter';
import { api } from '../api';
import * as apiModule from '../api';

describe('API Layer Integration Tests', () => {
  let mockAxios;
  let originalLocation;

  beforeEach(() => {
    // Create fresh mock for each test
    mockAxios = new MockAdapter(api, { onNoMatch: 'throwException' });
    
    // Mock window.location for redirect tests
    originalLocation = window.location;
    delete window.location;
    window.location = {
      assign: jest.fn(),
      pathname: '/dashboard',
      search: '',
      hash: ''
    };
  });

  afterEach(() => {
    mockAxios.restore();
    window.location = originalLocation;
  });

  describe('Axios Instance Configuration', () => {
    test('should create axios instance with correct baseURL', () => {
      expect(api.defaults.baseURL).toMatch(/\/api$/);
    });

    test('should include credentials for authentication', () => {
      expect(api.defaults.withCredentials).toBe(true);
    });

    test('should set correct content-type header', () => {
      expect(api.defaults.headers['Content-Type']).toBe('application/json');
    });

    test('should have timeout configured', () => {
      expect(api.defaults.timeout).toBe(10000);
    });
  });

  describe('Response Interceptor - Authentication (401)', () => {
    test('should redirect to login on 401 Unauthorized', async () => {
      mockAxios.onGet('/test-endpoint').reply(401, {
        error: 'Unauthorized'
      });

      await expect(api.get('/test-endpoint')).rejects.toThrow();
      
      expect(window.location.assign).toHaveBeenCalledWith(
        expect.stringContaining('/auth/login')
      );
    });

    test('should preserve current path in redirect next parameter', async () => {
      window.location.pathname = '/routes/management';
      window.location.search = '?shift=1';
      window.location.hash = '#section';

      mockAxios.onGet('/test-endpoint').reply(401);

      await expect(api.get('/test-endpoint')).rejects.toThrow();
      
      expect(window.location.assign).toHaveBeenCalledWith(
        expect.stringContaining('next=%2Froutes%2Fmanagement%3Fshift%3D1%23section')
      );
    });

    test('should not redirect if already on login page (avoid loop)', async () => {
      window.location.pathname = '/auth/login';

      mockAxios.onGet('/test-endpoint').reply(401);

      await expect(api.get('/test-endpoint')).rejects.toThrow();
      
      expect(window.location.assign).not.toHaveBeenCalled();
    });
  });

  describe('Response Interceptor - Authorization (403)', () => {
    test('should NOT redirect on 403 Forbidden', async () => {
      mockAxios.onGet('/restricted-endpoint').reply(403, {
        error: 'Forbidden',
        message: 'Insufficient permissions'
      });

      await expect(api.get('/restricted-endpoint')).rejects.toThrow();
      
      // Should NOT redirect - let component handle it
      expect(window.location.assign).not.toHaveBeenCalled();
    });

    test('should log warning for 403 errors', async () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      mockAxios.onGet('/forbidden').reply(403, { error: 'Forbidden' });

      await expect(api.get('/forbidden')).rejects.toThrow();
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('API Forbidden (403)'),
        expect.any(Object)
      );

      consoleSpy.mockRestore();
    });
  });

  describe('Response Interceptor - Network Errors', () => {
    test('should handle network errors with helpful message', async () => {
      mockAxios.onGet('/test-endpoint').networkError();

      await expect(api.get('/test-endpoint')).rejects.toThrow(
        /Network error|Network Error/i
      );
    });

    test('should log error details for debugging', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      mockAxios.onGet('/test-endpoint').reply(500, {
        error: 'Internal Server Error'
      });

      await expect(api.get('/test-endpoint')).rejects.toThrow();
      
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error Response:',
        expect.objectContaining({ error: 'Internal Server Error' })
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe('API Endpoints - Shifts', () => {
    test('should call GET /shifts', async () => {
      const mockShifts = [
        { id: '1', name: 'Morning', startTime: '08:00' },
        { id: '2', name: 'Evening', startTime: '16:00' }
      ];

      mockAxios.onGet('/shifts').reply(200, mockShifts);

      const response = await apiModule.getShifts();
      
      expect(response.data).toEqual(mockShifts);
    });

    test('should call GET /shifts/:id with correct path', async () => {
      const mockShift = { id: '1', name: 'Morning' };

      mockAxios.onGet('/shifts/1').reply(200, mockShift);

      const response = await apiModule.getShiftById('1');
      
      expect(response.data).toEqual(mockShift);
    });
  });

  describe('API Endpoints - Employees', () => {
    test('should call GET /employees', async () => {
      const mockEmployees = [
        { id: '1', name: 'John Doe', shiftId: '1' },
        { id: '2', name: 'Jane Smith', shiftId: '2' }
      ];

      mockAxios.onGet('/employees').reply(200, mockEmployees);

      const response = await apiModule.getEmployees();
      
      expect(response.data).toEqual(mockEmployees);
    });

    test('should validate shiftId before calling unassigned employees endpoint', () => {
      expect(() => apiModule.getUnassignedEmployeesByShift('')).toThrow('Invalid shift ID provided');
      expect(() => apiModule.getUnassignedEmployeesByShift('NaN')).toThrow('Invalid shift ID provided');
      expect(() => apiModule.getUnassignedEmployeesByShift(null)).toThrow('Invalid shift ID provided');
    });

    test('should call GET /employees/shift/:shiftId/unassigned with valid ID', async () => {
      const mockUnassigned = [
        { id: '3', name: 'Bob Johnson', assigned: false }
      ];

      mockAxios.onGet('/employees/shift/1/unassigned').reply(200, mockUnassigned);

      const response = await apiModule.getUnassignedEmployeesByShift('1');
      
      expect(response.data).toEqual(mockUnassigned);
    });

    test('should call PUT /employees/:id for updates', async () => {
      const updateData = { departmentId: '2' };
      const mockUpdated = { id: '1', name: 'John Doe', departmentId: '2' };

      mockAxios.onPut('/employees/1', updateData).reply(200, mockUpdated);

      const response = await apiModule.updateEmployee('1', updateData);
      
      expect(response.data).toEqual(mockUpdated);
    });
  });

  describe('API Endpoints - Routes', () => {
    test('should call GET /routes', async () => {
      const mockRoutes = [
        { id: '1', name: 'Route A', shiftId: '1' }
      ];

      mockAxios.onGet('/routes').reply(200, mockRoutes);

      const response = await apiModule.getRoutes();
      
      expect(response.data).toEqual(mockRoutes);
    });

    test('should validate shiftId before calling routes by shift endpoint', () => {
      expect(() => apiModule.getRoutesByShift('')).toThrow('Invalid shift ID provided');
      expect(() => apiModule.getRoutesByShift('NaN')).toThrow('Invalid shift ID provided');
    });

    test('should call GET /routes/shift/:shiftId with valid ID', async () => {
      const mockRoutes = [{ id: '1', shiftId: '1' }];

      mockAxios.onGet('/routes/shift/1').reply(200, mockRoutes);

      const response = await apiModule.getRoutesByShift('1');
      
      expect(response.data).toEqual(mockRoutes);
    });

    test('should call POST /routes for creation', async () => {
      const newRoute = { name: 'New Route', shiftId: '1' };
      const created = { id: '5', ...newRoute };

      mockAxios.onPost('/routes', newRoute).reply(201, created);

      const response = await apiModule.createRoute(newRoute);
      
      expect(response.data).toEqual(created);
    });

    test('should call PUT /routes/:id for updates', async () => {
      const updateData = { name: 'Updated Route' };
      const updated = { id: '1', ...updateData };

      mockAxios.onPut('/routes/1', updateData).reply(200, updated);

      const response = await apiModule.updateRoute('1', updateData);
      
      expect(response.data).toEqual(updated);
    });

    test('should call DELETE /routes/:id', async () => {
      mockAxios.onDelete('/routes/1').reply(204);

      const response = await apiModule.deleteRoute('1');
      
      expect(response.status).toBe(204);
    });
  });

  describe('API Endpoints - Shuttles', () => {
    test('should call GET /shuttles', async () => {
      const mockShuttles = [
        { id: '1', capacity: 25, available: true }
      ];

      mockAxios.onGet('/shuttles').reply(200, mockShuttles);

      const response = await apiModule.getShuttles();
      
      expect(response.data).toEqual(mockShuttles);
    });

    test('should call GET /shuttles/available', async () => {
      const mockAvailable = [
        { id: '2', capacity: 30, available: true }
      ];

      mockAxios.onGet('/shuttles/available').reply(200, mockAvailable);

      const response = await apiModule.getAvailableShuttles();
      
      expect(response.data).toEqual(mockAvailable);
    });

    test('should call GET /shuttles/:id', async () => {
      const mockShuttle = { id: '1', capacity: 25 };

      mockAxios.onGet('/shuttles/1').reply(200, mockShuttle);

      const response = await apiModule.getShuttleById('1');
      
      expect(response.data).toEqual(mockShuttle);
    });

    test('should call GET /shuttles/category/:categoryId', async () => {
      const mockShuttles = [
        { id: '1', categoryId: 'bus', capacity: 40 }
      ];

      mockAxios.onGet('/shuttles/category/bus').reply(200, mockShuttles);

      const response = await apiModule.getShuttlesByCategory('bus');
      
      expect(response.data).toEqual(mockShuttles);
    });
  });

  describe('API Endpoints - Clustering', () => {
    test('should call POST /fastapi/clusters/optimize with correct payload', async () => {
      const shuttles = [
        { id: '1', capacity: 25, category: 'bus', location: 'HQ' },
        { id: '2', capacity: 30, category: 'van', location: 'Branch' }
      ];

      const mockResponse = {
        routes: [
          { shuttleId: '1', employees: ['emp1', 'emp2'] }
        ]
      };

      mockAxios.onPost('/fastapi/clusters/optimize').reply((config) => {
        const data = JSON.parse(config.data);
        expect(data.shift_id).toBe('shift1');
        expect(data.date).toBe('2024-01-01');
        expect(data.shuttles).toHaveLength(2);
        expect(data.shuttles[0]).toMatchObject({
          id: '1',
          capacity: 25,
          category: 'bus',
          location: 'HQ'
        });
        return [200, mockResponse];
      });

      const response = await apiModule.optimizeClusters('shift1', '2024-01-01', shuttles);
      
      expect(response.data).toEqual(mockResponse);
    });

    test('should call POST /fastapi/clusters/shuttle/:shuttleId with correct payload', async () => {
      const mockResponse = {
        cluster: { shuttleId: '1', employees: ['emp1'] },
        route: { path: [[38.7, 9.0], [38.8, 9.1]] }
      };

      mockAxios.onPost('/fastapi/clusters/shuttle/1').reply((config) => {
        const data = JSON.parse(config.data);
        expect(data.shift_id).toBe('shift1');
        expect(data.date).toBe('2024-01-01');
        expect(data.include_route).toBe(true);
        return [200, mockResponse];
      });

      const response = await apiModule.getClusterForShuttle('shift1', '2024-01-01', '1');
      
      expect(response.data).toEqual(mockResponse);
    });

    test('should call POST /fastapi/clusters/route/optimize with employee data', async () => {
      const employees = [
        {
          id: 'emp1',
          location: 'Location A',
          stop: { latitude: 9.0, longitude: 38.7 }
        },
        {
          id: 'emp2',
          location: 'Location B',
          stop: { latitude: 9.1, longitude: 38.8 }
        }
      ];

      const mockResponse = {
        optimized_route: [[38.7, 9.0], [38.8, 9.1]],
        total_distance: 15.2
      };

      mockAxios.onPost('/fastapi/clusters/route/optimize').reply((config) => {
        const data = JSON.parse(config.data);
        expect(data.employees).toHaveLength(2);
        expect(data.employees[0]).toMatchObject({
          id: 'emp1',
          location: 'Location A',
          coordinates: { latitude: 9.0, longitude: 38.7 }
        });
        return [200, mockResponse];
      });

      const response = await apiModule.getOptimalRoute(employees);
      
      expect(response.data).toEqual(mockResponse);
    });
  });

  describe('API Endpoints - Departments', () => {
    test('should support full CRUD operations', async () => {
      // CREATE
      const newDept = { name: 'Engineering', description: 'Tech team' };
      const created = { id: '1', ...newDept };
      mockAxios.onPost('/departments', newDept).reply(201, created);
      
      let response = await apiModule.createDepartment(newDept);
      expect(response.data).toEqual(created);

      // READ ALL
      mockAxios.onGet('/departments').reply(200, [created]);
      response = await apiModule.getDepartments();
      expect(response.data).toHaveLength(1);

      // READ ONE
      mockAxios.onGet('/departments/1').reply(200, created);
      response = await apiModule.getDepartmentById('1');
      expect(response.data).toEqual(created);

      // UPDATE
      const updated = { ...created, name: 'Engineering Dept' };
      mockAxios.onPatch('/departments/1', { name: 'Engineering Dept' }).reply(200, updated);
      response = await apiModule.updateDepartment('1', { name: 'Engineering Dept' });
      expect(response.data).toEqual(updated);

      // DELETE
      mockAxios.onDelete('/departments/1').reply(204);
      response = await apiModule.deleteDepartment('1');
      expect(response.status).toBe(204);
    });

    test('should get department employees', async () => {
      const mockEmployees = [
        { id: '1', name: 'John', departmentId: 'dept1' }
      ];

      mockAxios.onGet('/departments/dept1/employees').reply(200, mockEmployees);

      const response = await apiModule.getDepartmentEmployees('dept1');
      
      expect(response.data).toEqual(mockEmployees);
    });
  });

  describe('API Endpoints - Locations', () => {
    test('should call GET /locations with type filter', async () => {
      const mockLocations = [
        { id: '1', type: 'HQ', name: 'Headquarters' }
      ];

      mockAxios.onGet('/locations', { params: { type: 'HQ' } }).reply(200, mockLocations);

      const response = await apiModule.getLocations('HQ');
      
      expect(response.data).toEqual(mockLocations);
    });

    test('should call GET /locations without filter', async () => {
      const mockLocations = [
        { id: '1', type: 'HQ', name: 'Headquarters' },
        { id: '2', type: 'Branch', name: 'Branch Office' }
      ];

      mockAxios.onGet('/locations').reply(200, mockLocations);

      const response = await apiModule.getLocations();
      
      expect(response.data).toEqual(mockLocations);
    });

    test('should support full CRUD operations', async () => {
      // CREATE
      const newLoc = { name: 'New HQ', type: 'HQ', coordinates: { lat: 9.0, lng: 38.7 } };
      const created = { id: '1', ...newLoc };
      mockAxios.onPost('/locations', newLoc).reply(201, created);
      
      let response = await apiModule.createLocation(newLoc);
      expect(response.data).toEqual(created);

      // UPDATE
      const updated = { ...created, name: 'Updated HQ' };
      mockAxios.onPut('/locations/1', { name: 'Updated HQ' }).reply(200, updated);
      response = await apiModule.updateLocation('1', { name: 'Updated HQ' });
      expect(response.data).toEqual(updated);

      // DELETE
      mockAxios.onDelete('/locations/1').reply(204);
      response = await apiModule.deleteLocation('1');
      expect(response.status).toBe(204);
    });

    test('should get location employees and routes', async () => {
      const mockEmployees = [{ id: '1', locationId: 'loc1' }];
      const mockRoutes = [{ id: '1', startLocationId: 'loc1' }];

      mockAxios.onGet('/locations/loc1/employees').reply(200, mockEmployees);
      mockAxios.onGet('/locations/loc1/routes').reply(200, mockRoutes);

      let response = await apiModule.getLocationEmployees('loc1');
      expect(response.data).toEqual(mockEmployees);

      response = await apiModule.getLocationRoutes('loc1');
      expect(response.data).toEqual(mockRoutes);
    });
  });

  describe('Error Handling Integration', () => {
    test('should handle 404 Not Found errors', async () => {
      mockAxios.onGet('/non-existent').reply(404, {
        error: 'Not Found',
        message: 'Resource does not exist'
      });

      await expect(api.get('/non-existent')).rejects.toMatchObject({
        response: {
          status: 404,
          data: expect.objectContaining({ error: 'Not Found' })
        }
      });
    });

    test('should handle 422 Validation errors', async () => {
      mockAxios.onPost('/routes').reply(422, {
        error: 'Validation Error',
        details: { shiftId: 'Required field' }
      });

      await expect(apiModule.createRoute({})).rejects.toMatchObject({
        response: {
          status: 422,
          data: expect.objectContaining({ error: 'Validation Error' })
        }
      });
    });

    test('should handle 500 Internal Server errors', async () => {
      mockAxios.onGet('/routes').reply(500, {
        error: 'Internal Server Error'
      });

      await expect(apiModule.getRoutes()).rejects.toMatchObject({
        response: {
          status: 500
        }
      });
    });
  });
});
