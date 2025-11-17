import api from '@/services/api';
import { AsyncHandler } from '@/utils/asyncHandler';

/**
 * Department Management Service
 * Handles all department-related API interactions with caching
 */
class DepartmentService {
  constructor() {
    // In-memory cache for departments
    this.cache = {
      departments: null,
      lastFetched: null,
      cacheTimeout: 5 * 60 * 1000, // 5 minutes cache timeout
      departmentDetails: new Map(), // Cache for individual department details
    };
  }

  /**
   * Create a new department
   * @param {Object} departmentData - Department data to create
   * @param {string} departmentData.name - Department name
   * @returns {Promise<Object>} Created department data
   * @throws {Error} If creation fails
   */
  createDepartment = AsyncHandler(async (departmentData) => {
    const response = await api.post('/departments', departmentData);
    this.clearCache();
    return response.data;
  });

  /**
   * Get all departments with employee count
   * @param {boolean} useCache - Whether to use cached data if available
   * @returns {Promise<Array>} List of departments
   * @throws {Error} If fetching fails
   */
  listDepartments = AsyncHandler(async (useCache = true) => {
    if (useCache &&
      this.cache.departments &&
      this.cache.lastFetched &&
      Date.now() - this.cache.lastFetched < this.cache.cacheTimeout) {
      return this.cache.departments;
    }

    const response = await api.get('/departments');
    this.cache.departments = response.data;
    this.cache.lastFetched = Date.now();
    return response.data;
  });

  /**
   * Get department by ID
   * @param {number} departmentId - Department ID
   * @param {boolean} useCache - Whether to use cached data if available
   * @returns {Promise<Object>} Department data with employees
   * @throws {Error} If fetching fails
   */
  getDepartment = AsyncHandler(async (departmentId, useCache = true) => {
    const cacheKey = `department_${departmentId}`;
    const cachedData = this.cache.departmentDetails.get(cacheKey);
    
    if (useCache && cachedData && Date.now() - cachedData.timestamp < this.cache.cacheTimeout) {
      return cachedData.department;
    }
    
    const response = await api.get(`/departments/${departmentId}`);
    this.cache.departmentDetails.set(cacheKey, {
      department: response.data,
      timestamp: Date.now(),
    });
    return response.data;
  });

  /**
   * Update department
   * @param {number} departmentId - Department ID
   * @param {Object} updates - Fields to update
   * @param {string} [updates.name] - Department name
   * @returns {Promise<Object>} Updated department
   * @throws {Error} If update fails
   */
  updateDepartment = AsyncHandler(async (departmentId, updates) => {
    const response = await api.patch(`/departments/${departmentId}`, updates);
    
    // Update cache if it exists
    if (this.cache.departments) {
      this.cache.departments = this.cache.departments.map(department =>
        department.id === departmentId ? { ...department, ...response.data } : department
      );
    }
    this.cache.departmentDetails.delete(`department_${departmentId}`);
    return response.data;
  });

  /**
   * Delete department
   * @param {number} departmentId - Department ID
   * @returns {Promise<boolean>} Success status
   * @throws {Error} If deletion fails
   */
  deleteDepartment = AsyncHandler(async (departmentId) => {
    await api.delete(`/departments/${departmentId}`);
    
    // Update cache if it exists
    if (this.cache.departments) {
      this.cache.departments = this.cache.departments.filter(department => department.id !== departmentId);
    }
    this.cache.departmentDetails.delete(`department_${departmentId}`);
    return true;
  });

  /**
   * Get all employees in a department
   * @param {number} departmentId - Department ID
   * @returns {Promise<Array>} List of employees
   * @throws {Error} If fetching fails
   */
  getDepartmentEmployees = AsyncHandler(async (departmentId) => {
    const response = await api.get(`/departments/${departmentId}/employees`);
    return response.data;
  });

  /**
   * Clear all caches
   */
  clearCache() {
    this.cache.departments = null;
    this.cache.lastFetched = null;
    this.cache.departmentDetails.clear();
  }

  /**
   * Clear specific department cache
   * @param {number} departmentId - Department ID
   */
  clearDepartmentCache(departmentId) {
    this.cache.departmentDetails.delete(`department_${departmentId}`);
    if (this.cache.departments) {
      this.cache.departments = this.cache.departments.filter(department => department.id !== departmentId);
    }
  }
}

export const departmentService = new DepartmentService();