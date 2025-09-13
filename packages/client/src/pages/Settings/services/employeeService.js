import api from '@/services/api';
import mainEmployeeService from '@/services/employeeService';
import { AsyncHandler } from '@/utils/asyncHandler';
// Lightweight response validation (fails open); mirrors base service usage
import { safeParseEmployees, safeParseEmployee } from '@/schemas/employee';

/**
 * Employee Management Service
 * Handles all employee-related API interactions with caching
 */
class EmployeeService {
  constructor() {
    this.cache = {
      employees: null,
      managementEmployees: null, // Separate cache for management view (includes deleted employees)
      lastFetched: null,
      managementLastFetched: null,
      cacheTimeout: 5 * 60 * 1000, // 5 minutes cache timeout
      employeeDetails: new Map(),
      stats: null,
      statsLastFetched: null
    };
  }

  /**
   * Upload employees in bulk from Excel file
   * @param {File} file Excel file with employee data
   * @returns {Promise<Object>} Upload result
   */
  uploadEmployees = AsyncHandler(async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    // Fix API path - remove /api prefix
    const response = await api.post('/employees/bulk-upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    this.clearCache();
    return response.data;
  });

  /**
   * Validate upload data before submission
   * @param {Array} data Employee data array
   * @returns {Promise<Object>} Validation results
   */
  validateUploadData = AsyncHandler(async (data) => {
    // Fix API path - remove /api prefix
    const response = await api.post('/employees/validate-upload', data);
    return response.data;
  });

  /**
   * Get employee upload template
   * @returns {Promise<Blob>} Excel template file
   */
  getUploadTemplate = AsyncHandler(async () => {
    try {
      // Fix API path - remove /api prefix
      const response = await api.get('/employees/upload-template', {
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      console.error("Error downloading template:", error);
      // Create a simple fallback template if API fails
      return this.generateFallbackTemplate();
    }
  });

  /**
   * Generate a fallback template in case API doesn't support template download
   * @returns {Blob} Excel template as blob
   */
  generateFallbackTemplate() {
    const headers = [
      "Name",
      "Email",
      "Phone",
      "Department",
      "Area Name",
      "Latitude",
      "Longitude"
    ];

    // Use the correct department names from the actual system
    const example = [
      "Abebe Kebede",
      "abebe.k@example.com",
      "+251911234567",
  "Operations",
      "Bole",
      "9.0221",
      "38.7468"
    ];
    
    // Create CSV content
    let csvContent = headers.join(",") + "\n" + example.join(",");
    
    // Convert to Blob
    return new Blob([csvContent], { type: 'text/csv' });
  }

  /**
   * Get employee statistics
   * @param {boolean} useCache Whether to use cached data
   * @returns {Promise<Object>} Employee statistics
   */
  getEmployeeStats = AsyncHandler(async (useCache = true) => {
    if (useCache && 
        this.cache.stats && 
        this.cache.statsLastFetched && 
        Date.now() - this.cache.statsLastFetched < this.cache.cacheTimeout) {
      return this.cache.stats;
    }

    try {
      // Reuse base service stats (which prefers /employees/stats with fallback)
      const stats = await mainEmployeeService.getEmployeeStats();
      this.cache.stats = stats;
      this.cache.statsLastFetched = Date.now();
      return stats;
    } catch (error) {
      console.error('[managementEmployeeService.getEmployeeStats] failed to reuse base stats:', error?.message);
      return { total: 0, assigned: 0, departments: 0, recentlyAdded: 0 };
    }
  });

  /**
   * Get all employees with proper filtering of deleted and assignment status
   * @param {boolean} useCache Whether to use cached data
   * @returns {Promise<Array>} List of employees
   */
  listEmployees = AsyncHandler(async (useCache = true) => {
    if (useCache && 
        this.cache.employees && 
        this.cache.lastFetched && 
        Date.now() - this.cache.lastFetched < this.cache.cacheTimeout) {
      return this.cache.employees;
    }

    const response = await api.get('/employees');
    const rawEmployees = safeParseEmployees(response.data);
    const employees = rawEmployees
      .filter(emp => !emp.deleted)
      .map(emp => ({
        ...emp,
        assigned: Boolean(emp.shuttle || emp.assigned),
        status: emp.deleted ? 'inactive' : (emp.status || 'active')
      }));
    
    this.cache.employees = employees;
    this.cache.lastFetched = Date.now();
    
    return employees;
  });

  /**
   * Get all employees including deleted ones (for employee management)
   * @param {boolean} useCache Whether to use cached data
   * @returns {Promise<Array>} List of all employees including deleted ones
   */
  listEmployeesForManagement = AsyncHandler(async (useCache = true) => {
    if (useCache && 
        this.cache.managementEmployees && 
        this.cache.managementLastFetched && 
        Date.now() - this.cache.managementLastFetched < this.cache.cacheTimeout) {
      return this.cache.managementEmployees;
    }

    // Use the new management endpoint
    const response = await api.get('/employees/management');
    const rawEmployees = safeParseEmployees(response.data);
    const employees = rawEmployees.map(emp => ({
      ...emp,
      assigned: Boolean(emp.shuttle || emp.assigned),
      status: emp.deleted ? 'inactive' : (emp.status || 'active')
    }));
    
    this.cache.managementEmployees = employees;
    this.cache.managementLastFetched = Date.now();
    
    return employees;
  });

  /**
   * Get employee by ID using the main app's service for consistency
   * @param {number} employeeId Employee ID
   * @param {boolean} useCache Whether to use cached data
   * @returns {Promise<Object>} Employee data
   */
  getEmployee = AsyncHandler(async (employeeId, useCache = true) => {
    const cacheKey = `employee_${employeeId}`;
    const cachedData = this.cache.employeeDetails.get(cacheKey);

    if (useCache && 
        cachedData && 
        Date.now() - cachedData.timestamp < this.cache.cacheTimeout) {
      return cachedData.employee;
    }

    // Use the main app's employee service for consistency
    const employee = await mainEmployeeService.getEmployeeById(employeeId);
    
    this.cache.employeeDetails.set(cacheKey, {
      employee,
      timestamp: Date.now()
    });
    
    return employee;
  });

  /**
   * Process employee data from paste or file upload
   * @param {Array<Object>} data Employee data to process
   * @returns {Promise<Object>} Processing results
   */
  processEmployeeData = AsyncHandler(async (data) => {
    try {
      // Add debug logging for incoming data
      console.log('Raw data received:', data);

      // Get current departments for matching
      const departmentsResponse = await this.getDepartments();
      const availableDepts = departmentsResponse.map(d => ({
        id: d.id,
        name: d.name,
        normalized: d.name.toLowerCase().trim().replace(/\s+/g, ' ')
      }));
      
      // Get existing employees to check for duplicates
      const existingEmployees = await this.listEmployees(false);
      
      // Create name+location lookup for faster duplicate checking
      const existingNameLocationCombos = new Set(
        existingEmployees.map(emp => `${emp.name.toLowerCase()}|${emp.location.toLowerCase()}`)
      );
      
      console.log(`Checking against ${existingEmployees.length} existing employees for duplicates`);
      console.log('Available departments:', availableDepts);

      // Track duplicates
      const duplicates = [];
      
  // First pass - identify duplicates within the upload itself
      const nameLocationMap = new Map();
      data.forEach(emp => {
        if (emp.name && emp.location) {
          const key = `${emp.name.toLowerCase()}|${emp.location.toLowerCase()}`;
          if (nameLocationMap.has(key)) {
            nameLocationMap.set(key, nameLocationMap.get(key) + 1);
          } else {
            nameLocationMap.set(key, 1);
          }
        }
      });
      
      // Validate and format each employee's data with better department matching
      const formattedData = data.filter(employee => {
        // Skip employees with invalid name or location
        if (!employee.name?.trim() || !employee.location?.trim()) {
          return true; // Keep these for backend validation
        }
        
        // Check for duplicates with existing employees
        const nameLocationCombo = `${employee.name.toLowerCase()}|${employee.location.toLowerCase()}`;
        
        // Check if this is a duplicate of an existing employee
        if (existingNameLocationCombos.has(nameLocationCombo)) {
          console.log(`Skipping duplicate: ${employee.name} at ${employee.location}`);
          duplicates.push({
            name: employee.name,
            location: employee.location,
            reason: "Exists in database"
          });
          return false;
        }
        
  // Check if this is a duplicate within the upload itself (more than one occurrence)
        if (nameLocationMap.get(nameLocationCombo) > 1) {
          // Only skip duplicates after the first occurrence
          if (!duplicates.some(d => 
            d.name.toLowerCase() === employee.name.toLowerCase() && 
            d.location.toLowerCase() === employee.location.toLowerCase() &&
            d.reason === "Duplicate within upload"
          )) {
            // Keep the first occurrence, skip the rest
            return true;
          }
          
          console.log(`Skipping duplicate within upload: ${employee.name} at ${employee.location}`);
          duplicates.push({
            name: employee.name,
            location: employee.location,
            reason: "Duplicate within upload"
          });
          return false;
        }
        
        return true;
      }).map(employee => {
        // Process department matching and other formatting
        // Normalize the department name from the input
        const departmentName = employee.department?.trim();
        const normalizedDeptName = departmentName?.toLowerCase().replace(/\s+/g, ' ');
        
        // Try to find the department ID
        let departmentId = employee.departmentId;
        if (!departmentId && departmentName) {
          // Try exact match first
          let foundDept = availableDepts.find(d => d.normalized === normalizedDeptName);
          
          // If no exact match, try partial match
          if (!foundDept) {
            foundDept = availableDepts.find(d => 
              d.normalized.includes(normalizedDeptName) || 
              normalizedDeptName.includes(d.normalized)
            );
          }
          
          departmentId = foundDept?.id;
          
          console.log(`Department matching for "${departmentName}":`, {
            normalized: normalizedDeptName,
            foundDept,
            departmentId
          });
          
          if (!departmentId) {
            throw new Error(`Department "${departmentName}" not found. Available departments: ${availableDepts.map(d => d.name).join(', ')}`);
          }
        }

        return {
          name: employee.name?.trim(),
          departmentId: typeof departmentId === 'string' ? parseInt(departmentId, 10) : departmentId,
          shiftId: typeof employee.shiftId === 'string' ? parseInt(employee.shiftId, 10) : employee.shiftId,
          location: employee.location?.trim() || employee.areaName?.trim(),
          latitude: parseFloat(employee.latitude) || null,
          longitude: parseFloat(employee.longitude) || null,
        };
      });

      console.log('Formatted data to send:', formattedData);
      console.log(`Skipped ${duplicates.length} duplicates`);

      // FIX: Create employees directly without separately creating stops
      // The backend will handle stop creation for us
      const results = await Promise.all(
        formattedData.map(async (employee) => {
          try {
            // Create employee with coordinates - the backend will create the stop
            const response = await api.post('/employees', employee);
            return { success: true, data: response.data };
          } catch (err) {
            console.error('Error creating employee:', err);
            return { success: false, error: err.message };
          }
        })
      );
      
      const successCount = results.filter(r => r.success).length;
      const failureCount = results.length - successCount;
      
      this.clearCache();
      return {
        success: successCount > 0,
        processedCount: successCount,
        failedCount: failureCount,
        duplicateCount: duplicates.length, // Return the duplicate count
        duplicates: duplicates, // Return the list of duplicates for UI handling
        message: `Successfully added ${successCount} employees` + 
                 (failureCount > 0 ? `. Failed to add ${failureCount} employees.` : '') +
                 (duplicates.length > 0 ? `. Skipped ${duplicates.length} duplicates.` : '')
      };

    } catch (error) {
      console.error("Error processing employee data:", error);
      throw new Error(error.response?.data?.error || error.message || "Failed to process employee data");
    }
  });

  /**
   * Get all departments
   * @returns {Promise<Array>} List of departments
   */
  getDepartments = AsyncHandler(async () => {
    try {
      // Fix API path - remove /api prefix
      const response = await api.get('/departments');
      return response.data;
    } catch (error) {
      console.error("Error fetching departments:", error);
      // Return minimal fallback data
      return [
        { id: 1, name: "Engineering" },
        { id: 2, name: "Finance" },
        { id: 3, name: "HR" },
        { id: 4, name: "Operations" }
      ];
    }
  });

  /**
   * Get all shifts
   * @returns {Promise<Array>} List of shifts
   */
  getShifts = AsyncHandler(async () => {
    try {
      // Fix API path - remove /api prefix
      const response = await api.get('/shifts');
      return response.data;
    } catch (error) {
      console.error("Error fetching shifts:", error);
      // Return minimal fallback data
      return [
        { id: 1, name: "Morning" },
        { id: 2, name: "Afternoon" },
        { id: 3, name: "Evening" }
      ];
    }
  });

  /**
   * Create a single employee
   * @param {Object} employeeData Employee data to create
   * @returns {Promise<Object>} Created employee
   */
  createEmployee = AsyncHandler(async (employeeData) => {
  // Delegate to base service to avoid duplication; base service already validates
  const created = await mainEmployeeService.createEmployee(employeeData);
  this.clearCache();
  return created;
  });

  /**
   * Deactivate an employee (soft delete)
   * @param {string} employeeId Employee ID to deactivate
   * @returns {Promise<Object>} Updated employee data
   */
  deactivateEmployee = AsyncHandler(async (employeeId) => {
  const deactivated = await mainEmployeeService.deactivateEmployee(employeeId);
  this.clearCache();
  return deactivated;
  });

  /**
   * Activate (restore) a soft-deleted employee
   * @param {string} employeeId Employee ID to activate
   * @returns {Promise<Object>} Updated employee data
   */
  activateEmployee = AsyncHandler(async (employeeId) => {
    const response = await api.patch(`/employees/${employeeId}/restore`);
    this.clearCache();
    return safeParseEmployee(response.data);
  });

  /**
   * Update employee data including assignment status
   * @param {string} employeeId Employee ID to update
   * @param {Object} data Update data
   * @returns {Promise<Object>} Updated employee data
   */
  updateEmployee = AsyncHandler(async (employeeId, data) => {
    const updated = await mainEmployeeService.updateEmployee(employeeId, {
      ...data,
      assigned: data.assigned !== undefined ? data.assigned : Boolean(data.shuttle)
    });
    this.clearCache();
    return updated;
  });

  /**
   * Clear all caches
   */
  clearCache() {
    this.cache.employees = null;
    this.cache.managementEmployees = null;
    this.cache.lastFetched = null;
    this.cache.managementLastFetched = null;
    this.cache.stats = null;
    this.cache.statsLastFetched = null;
    this.cache.employeeDetails.clear();
  }

  /**
   * Get all employees with filtering and pagination
   * @param {Object} filters Filter parameters
   * @param {number} page Current page number
   * @param {number} limit Items per page
   * @param {boolean} useCache Whether to use cached data
   * @returns {Promise<Object>} Paginated list of employees with metadata
   */
  listEmployeesWithFilters = AsyncHandler(async (filters = {}, page = 1, limit = 10, useCache = false) => {
    // Don't use cache when filters are applied
    if (Object.keys(filters).length > 0) {
      useCache = false;
    }

    if (useCache && 
        this.cache.employees && 
        this.cache.lastFetched && 
        Date.now() - this.cache.lastFetched < this.cache.cacheTimeout) {
      
      // Apply pagination to cached data
      const start = (page - 1) * limit;
      const end = start + limit;
      const paginatedData = this.cache.employees.slice(start, end);
      
      return {
        data: paginatedData,
        meta: {
          page,
          limit,
          total: this.cache.employees.length,
          totalPages: Math.ceil(this.cache.employees.length / limit)
        }
      };
    }

    // Build query params for filtering and pagination
    const queryParams = new URLSearchParams();
    queryParams.append('page', page);
    queryParams.append('limit', limit);
    
    // Add filters to query params
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== 'all') {
        queryParams.append(key, value);
      }
    });
    
    const response = await api.get(`/employees?${queryParams.toString()}`);
    const parsed = Array.isArray(response.data?.data) ? safeParseEmployees(response.data.data) : [];
    const employees = parsed.map(emp => ({
      ...emp,
      assigned: Boolean(emp.shuttle || emp.assigned),
      status: emp.deleted ? 'inactive' : (emp.status || 'active')
    }));
    
    // Only update cache when no filters are applied
    if (Object.keys(filters).length === 0) {
      this.cache.employees = employees;
      this.cache.lastFetched = Date.now();
    }
    
    return {
      data: employees,
      meta: response.data.meta
    };
  });



  /**
   * Get employee growth data for charts
   * Returns monthly employee and driver count data for trend visualization
   * 
   * @param {boolean} useCache Whether to use cached data
   * @returns {Promise<Array>} Array of monthly data points
   */
  getEmployeeGrowthData = AsyncHandler(async (useCache = true) => {
    const cacheKey = 'employeeGrowthData';
    const cachedData = this.cache.employeeDetails.get(cacheKey);

    if (useCache && 
        cachedData && 
        Date.now() - cachedData.timestamp < this.cache.cacheTimeout) {
      return cachedData.data;
    }
    
    try {
      // Build growth from existing data since /employees|drivers/history endpoints are unavailable
      const [employees, drivers] = await Promise.all([
        this.listEmployees(false),
        // Import driverService lazily to avoid circular deps
        import('./driverService').then(m => m.driverService.listDrivers(false)).catch(() => [])
      ]);

      const currentDate = new Date();
      const monthsToShow = 6;

      const months = Array.from({ length: monthsToShow }, (_, i) => {
        const date = new Date();
        date.setMonth(currentDate.getMonth() - (monthsToShow - 1 - i));
        return {
          label: `${date.toLocaleString('default', { month: 'short' })}${date.getFullYear() !== currentDate.getFullYear() ? ' ' + date.getFullYear() : ''}`,
          y: date.getFullYear(),
          m: date.getMonth(),
        };
      });

      const countByMonth = (items) => (y, m) => items.filter(it => {
        if (!it?.createdAt) return false;
        const dt = new Date(it.createdAt);
        return dt.getFullYear() === y && dt.getMonth() === m;
      }).length;

      const employeeCountFor = countByMonth(employees);
      const driverCountFor = Array.isArray(drivers) ? countByMonth(drivers) : () => 0;

      const growthData = months.map(({ label, y, m }) => ({
        month: label,
        employeeCount: employeeCountFor(y, m),
        driverCount: driverCountFor(y, m),
      }));

      this.cache.employeeDetails.set(cacheKey, { data: growthData, timestamp: Date.now() });
      return growthData;
    } catch (error) {
      console.error("Error computing employee growth data:", error);
      return this.getFallbackGrowthData();
    }
  });

  /**
   * Generate fallback growth data for charts when API fails
   * 
   * @private
   * @returns {Array} Array of mock monthly data points
   */
  getFallbackGrowthData() {
    const currentDate = new Date();
    const monthsToShow = 6;
    
    // Generate mock data that shows reasonable growth trends
    const months = Array.from({ length: monthsToShow }, (_, i) => {
      const date = new Date();
      date.setMonth(currentDate.getMonth() - (monthsToShow - 1 - i));
      
      const month = date.toLocaleString('default', { month: 'short' });
      const year = date.getFullYear();
      const monthLabel = `${month}${year !== currentDate.getFullYear() ? ' ' + year : ''}`;
      
      // Generate data with slight random variations but overall growth trend
      const baseEmployeeCount = 80 + (i * 15);
      const employeeVariance = Math.floor(Math.random() * 10) - 5; // -5 to +5
      
      const baseDriverCount = 25 + (i * 5);
      const driverVariance = Math.floor(Math.random() * 6) - 3; // -3 to +3
      
      return {
        month: monthLabel,
        employeeCount: Math.max(0, baseEmployeeCount + employeeVariance),
        driverCount: Math.max(0, baseDriverCount + driverVariance)
      };
    });
    
    return months;
  }
}

export const employeeService = new EmployeeService();