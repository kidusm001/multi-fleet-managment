import { AsyncHandler } from '../utils/asyncHandler';

import api from './api';

class DepartmentService {
    constructor() {
        // In-memory cache for departments
        this.cache = {
            departments: null,
            lastFetched: null,
            cacheTimeout: 10 * 60 * 1000, // 10 minutes cache timeout
            departmentEmployees: new Map(), // Cache for department employees
        };
    }

    /**
     * Get all departments with optional caching
     * @param {boolean} useCache - Whether to use cached data if available
     * @returns {Promise<Array>} Array of departments
     */
    getAllDepartments = AsyncHandler(async (useCache = true) => {
        // Return cached data if it's still valid
        if (useCache &&
            this.cache.departments &&
            this.cache.lastFetched &&
            Date.now() - this.cache.lastFetched < this.cache.cacheTimeout) {
            return this.cache.departments;
        }

        const response = await api.get('/departments', {
            params: {
                include: 'employeeCount,managerName', // Get additional data in single request
            },
        });

        // Update cache
        this.cache.departments = response.data;
        this.cache.lastFetched = Date.now();

        return response.data;
    });

    /**
     * Get department by ID with all related information
     * @param {number} id - Department ID
     * @returns {Promise<Object>} Department object with related data
     */
    getDepartmentById = AsyncHandler(async (id) => {
        // Check cache first
        if (this.cache.departments) {
            const cachedDept = this.cache.departments.find(dept => dept.id === id);
            if (cachedDept) return cachedDept;
        }

        const response = await api.get(`/departments/${id}`, {
            params: {
                include: 'employees,manager,metrics', // Get all related data
            },
        });
        return response.data;
    });

    /**
     * Get employees in a department with caching
     * @param {number} departmentId - Department ID
     * @returns {Promise<Array>} Array of employees
     */
    getDepartmentEmployees = AsyncHandler(async (departmentId) => {
        // Check cache
        const cacheKey = `dept_${departmentId}`;
        const cachedData = this.cache.departmentEmployees.get(cacheKey);

        if (cachedData && Date.now() - cachedData.timestamp < this.cache.cacheTimeout) {
            return cachedData.employees;
        }

        const response = await api.get(`/departments/${departmentId}/employees`, {
            params: {
                include: 'position,shift,stop', // Include related data
                sort: 'name', // Sort by name
            },
        });

        // Update cache
        this.cache.departmentEmployees.set(cacheKey, {
            employees: response.data,
            timestamp: Date.now(),
        });

        return response.data;
    });

    /**
     * Create a new department
     * @param {Object} departmentData - Department data
     * @returns {Promise<Object>} Created department
     */
    createDepartment = AsyncHandler(async (departmentData) => {
        const response = await api.post('/departments', departmentData);

        // Invalidate cache
        this.clearCache();

        return response.data;
    });

    /**
     * Update a department
     * @param {number} id - Department ID
     * @param {Object} updates - Update data
     * @returns {Promise<Object>} Updated department
     */
    updateDepartment = AsyncHandler(async (id, updates) => {
        const response = await api.put(`/departments/${id}`, updates);

        // Update cache if it exists
        if (this.cache.departments) {
            this.cache.departments = this.cache.departments.map(dept =>
                dept.id === id ? { ...dept, ...response.data } : dept
            );
        }

        return response.data;
    });

    /**
     * Delete a department
     * @param {number} id - Department ID
     * @returns {Promise<void>}
     */
    deleteDepartment = AsyncHandler(async (id) => {
        await api.delete(`/departments/${id}`);

        // Update cache if it exists
        if (this.cache.departments) {
            this.cache.departments = this.cache.departments.filter(dept => dept.id !== id);
        }

        // Remove department employees from cache
        this.cache.departmentEmployees.delete(`dept_${id}`);
    });

    /**
     * Get department statistics
     * @param {number} departmentId - Department ID
     * @returns {Promise<Object>} Department statistics
     */
    getDepartmentStats = AsyncHandler(async (departmentId) => {
        const response = await api.get(`/departments/${departmentId}/statistics`);
        return response.data;
    });

    /**
     * Batch update departments
     * @param {Array<Object>} updates - Array of department updates
     * @returns {Promise<Array>} Updated departments
     */
    batchUpdateDepartments = AsyncHandler(async (updates) => {
        const response = await api.post('/departments/batch-update', { updates });

        // Invalidate cache as multiple departments were updated
        this.clearCache();

        return response.data;
    });

    /**
     * Clear all caches
     */
    clearCache() {
        this.cache.departments = null;
        this.cache.lastFetched = null;
        this.cache.departmentEmployees.clear();
    }

    /**
     * Clear specific department cache
     * @param {number} departmentId - Department ID
     */
    clearDepartmentCache(departmentId) {
        this.cache.departmentEmployees.delete(`dept_${departmentId}`);
        if (this.cache.departments) {
            this.cache.departments = this.cache.departments.filter(dept => dept.id !== departmentId);
        }
    }
}

export const departmentService = new DepartmentService(); 