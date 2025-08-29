import api from './api';
import { safeParseEmployees, safeParseEmployee } from '../schemas/employee';

const employeeService = {
  getAllEmployees: async () => {
    const response = await api.get('/employees');
    return safeParseEmployees(response.data);
  },

  getEmployeeById: async (id) => {
    const response = await api.get(`/employees/${id}`);
    return safeParseEmployee(response.data);
  },

  createEmployee: async (employeeData) => {
    const response = await api.post('/employees', employeeData);
    return safeParseEmployee(response.data);
  },

  updateEmployee: async (id, employeeData) => {
    const response = await api.put(`/employees/${id}`, employeeData);
    return safeParseEmployee(response.data);
  },

  deleteEmployee: async (id) => {
    await api.delete(`/employees/${id}`);
  },


  // Updated: backend soft delete uses DELETE; previous POST deactivate endpoint does not exist
  deactivateEmployee: async (employeeId) => {
  const response = await api.delete(`/employees/${employeeId}`);
  // Validate deleted (soft-deactivated) employee shape
  return safeParseEmployee(response.data);
  },

  // Stub: backend /employees/suggest-routes not present yet. Provide safe fallback.
  suggestRoutes: (() => {
    let warned = false;
    return async (_location) => {
      if (!warned) {
        console.warn('[employeeService.suggestRoutes] Endpoint missing; returning empty list.');
        warned = true;
      }
      return [];
    };
  })(),

  getEmployeeStats: async () => {
    // Preferred: backend aggregated stats endpoint
    try {
      const response = await api.get('/employees/stats');
      const data = response.data || {};
      // Basic shape guard with graceful fallback pieces
      const total = typeof data.total === 'number' ? data.total : 0;
      const assigned = typeof data.assigned === 'number' ? data.assigned : 0;
      const departments = typeof data.departments === 'number' ? data.departments : 0;
      const recentlyAdded = typeof data.recentlyAdded === 'number' ? data.recentlyAdded : 0;
      return { total, assigned, departments, recentlyAdded };
    } catch (primaryError) {
      console.warn('[employeeService.getEmployeeStats] /employees/stats failed, falling back to client derivation:', primaryError?.message);
      // Fallback: derive from management listing
      try {
        const response = await api.get('/employees/management');
        const employees = safeParseEmployees(response.data || []);
        const total = employees.length;
        const assigned = employees.filter(emp => emp.assigned || emp.departmentId).length;
        const departments = new Set(employees.map(emp => emp.departmentId).filter(Boolean)).size;
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        const recentlyAdded = employees.filter(emp => {
          const createdAt = emp.createdAt ? new Date(emp.createdAt) : null;
          return createdAt ? createdAt > weekAgo : false;
        }).length;
        return { total, assigned, departments, recentlyAdded };
      } catch (fallbackError) {
        console.error('[employeeService.getEmployeeStats] fallback derivation failed:', fallbackError?.message);
        return { total: 0, assigned: 0, departments: 0, recentlyAdded: 0 };
      }
    }
  },
};

export const {
  getAllEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  deactivateEmployee,
  suggestRoutes,
  getEmployeeStats,
} = employeeService;

export { employeeService };
export default employeeService; 