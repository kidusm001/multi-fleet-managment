import { departmentService } from '../departmentService';
import api from '../api';

jest.mock('../api');

describe('departmentService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Clear the service cache to prevent test interference
    departmentService.clearCache();
  });

  describe('getAllDepartments', () => {
    it('should fetch all departments', async () => {
      const mockDepartments = [
        { id: '1', name: 'Engineering', employeeCount: 50 },
        { id: '2', name: 'HR', employeeCount: 10 }
      ];
      api.get.mockResolvedValue({ data: mockDepartments });

      const result = await departmentService.getAllDepartments();

      expect(api.get).toHaveBeenCalledWith('/departments', {
        params: { include: 'employeeCount,managerName' }
      });
      expect(result).toEqual(mockDepartments);
    });
  });

  describe('getDepartmentById', () => {
    it('should fetch department by id', async () => {
      const mockDepartment = { id: '1', name: 'Engineering', employeeCount: 50 };
      api.get.mockResolvedValue({ data: mockDepartment });

      const result = await departmentService.getDepartmentById('1');

      expect(api.get).toHaveBeenCalledWith('/departments/1', { params: { include: 'employees,manager,metrics' } });
      expect(result).toEqual(mockDepartment);
    });
  });

  describe('createDepartment', () => {
    it('should create a new department', async () => {
      const newDept = { name: 'Finance' };
      const createdDept = { id: '3', ...newDept, employeeCount: 0 };
      api.post.mockResolvedValue({ data: createdDept });

      const result = await departmentService.createDepartment(newDept);

      expect(api.post).toHaveBeenCalledWith('/departments', newDept);
      expect(result).toEqual(createdDept);
    });
  });

  describe('updateDepartment', () => {
    it('should update an existing department', async () => {
      const updateData = { name: 'Engineering Updated' };
      const updatedDept = { id: '1', ...updateData };
      api.put.mockResolvedValue({ data: updatedDept });

      const result = await departmentService.updateDepartment('1', updateData);

      expect(api.put).toHaveBeenCalledWith('/departments/1', updateData);
      expect(result).toEqual(updatedDept);
    });
  });

  describe('deleteDepartment', () => {
    it('should delete a department', async () => {
      api.delete.mockResolvedValue({ data: {} });

      await departmentService.deleteDepartment('1');

      expect(api.delete).toHaveBeenCalledWith('/departments/1');
    });
  });
});
