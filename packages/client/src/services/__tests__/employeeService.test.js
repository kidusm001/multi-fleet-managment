import employeeService from '../employeeService';
import api from '../api';

// Mock the api module
jest.mock('../api', () => ({
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
  patch: jest.fn(),
}));

describe('employeeService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllEmployees', () => {
    it('should fetch all employees successfully', async () => {
      const mockEmployees = [
        { id: '1', firstName: 'John', lastName: 'Doe', email: 'john@example.com' },
        { id: '2', firstName: 'Jane', lastName: 'Smith', email: 'jane@example.com' }
      ];
      api.get.mockResolvedValue({ data: mockEmployees });

      const result = await employeeService.getAllEmployees();

      expect(api.get).toHaveBeenCalledWith('/employees');
      expect(result).toEqual(mockEmployees);
    });

    it('should handle errors when fetching employees', async () => {
      api.get.mockRejectedValue(new Error('Network error'));

      await expect(employeeService.getAllEmployees()).rejects.toThrow('Network error');
    });
  });

  describe('getEmployeeById', () => {
    it('should fetch employee by id', async () => {
      const mockEmployee = { id: '1', firstName: 'John', lastName: 'Doe', email: 'john@example.com' };
      api.get.mockResolvedValue({ data: mockEmployee });

      const result = await employeeService.getEmployeeById('1');

      expect(api.get).toHaveBeenCalledWith('/employees/1');
      expect(result).toEqual(mockEmployee);
    });
  });

  describe('createEmployee', () => {
    it('should create a new employee', async () => {
      const newEmployee = { firstName: 'John', lastName: 'Doe', email: 'john@example.com' };
      const createdEmployee = { id: '1', ...newEmployee };
      api.post.mockResolvedValue({ data: createdEmployee });

      const result = await employeeService.createEmployee(newEmployee);

      expect(api.post).toHaveBeenCalledWith('/employees', newEmployee);
      expect(result).toEqual({ id: '1', ...newEmployee });
    });
  });

  describe('updateEmployee', () => {
    it('should update an existing employee', async () => {
      const updateData = { firstName: 'John', lastName: 'Updated' };
      const updatedEmployee = { id: '1', ...updateData };
      api.put.mockResolvedValue({ data: updatedEmployee });

      const result = await employeeService.updateEmployee('1', updateData);

      expect(api.put).toHaveBeenCalledWith('/employees/1', updateData);
      expect(result).toEqual({ id: '1', ...updateData });
    });
  });

  describe('deleteEmployee', () => {
    it('should delete an employee', async () => {
      api.delete.mockResolvedValue({ data: {} });

      await employeeService.deleteEmployee('1');

      expect(api.delete).toHaveBeenCalledWith('/employees/1');
    });
  });

  describe('deactivateEmployee', () => {
    it('should deactivate an employee', async () => {
      const mockEmployee = { id: '1', firstName: 'John', deleted: true };
      api.delete.mockResolvedValue({ data: mockEmployee });

      await employeeService.deactivateEmployee('1');

      expect(api.delete).toHaveBeenCalledWith('/employees/1');
    });
  });

  describe('suggestRoutes', () => {
    it('should return empty array for suggest routes', async () => {
      const result = await employeeService.suggestRoutes({ lat: 9.03, lng: 38.74 });

      expect(result).toEqual([]);
    });
  });

  describe('getEmployeeStats', () => {
    it('should fetch employee statistics', async () => {
      const mockStats = { total: 100, active: 80, inactive: 20 };
      api.get.mockResolvedValue({ data: mockStats });

      await employeeService.getEmployeeStats();

      expect(api.get).toHaveBeenCalled();
    });
  });
});
