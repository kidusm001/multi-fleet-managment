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

  deactivateEmployee: async (employeeId) => {
    const response = await api.delete(`/employees/${employeeId}`);
    return safeParseEmployee(response.data);
  },

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
    try {
      const response = await api.get('/employees/stats/summary');
      const data = response.data || {};
      const total = typeof data.totalEmployees === 'number' ? data.totalEmployees : 0;
      const assigned = typeof data.assignedEmployees === 'number' ? data.assignedEmployees : 0;
      const departments = typeof data.employeesByDepartment === 'object' ? Object.keys(data.employeesByDepartment).length : 0;
      const recentlyAdded = typeof data.activeEmployees === 'number' ? data.activeEmployees : 0;
      return { total, assigned, departments, recentlyAdded };
    } catch (primaryError) {
      console.warn('[employeeService.getEmployeeStats] /employees/stats/summary failed, falling back to client derivation:', primaryError?.message);
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

  getCurrentEmployee: async () => {
    const response = await api.get('/employees/me');
    return safeParseEmployee(response.data);
  },
};

export const {
  getAllEmployees,
  getEmployeeById,
  getCurrentEmployee,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  deactivateEmployee,
  suggestRoutes,
  getEmployeeStats,
} = employeeService;

export { employeeService };
export default employeeService;