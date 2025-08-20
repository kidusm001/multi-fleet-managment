import api from './api';

const employeeService = {
  getAllEmployees: async () => {
    const response = await api.get('/employees');
    return response.data;
  },

  getEmployeeById: async (id) => {
    const response = await api.get(`/employees/${id}`);
    return response.data;
  },

  createEmployee: async (employeeData) => {
    const response = await api.post('/employees', employeeData);
    return response.data;
  },

  updateEmployee: async (id, employeeData) => {
    const response = await api.put(`/employees/${id}`, employeeData);
    return response.data;
  },

  deleteEmployee: async (id) => {
    await api.delete(`/employees/${id}`);
  },

  getEmployeesByCompany: async (companyId) => {
    const response = await api.get(`/employees/company/${companyId}`);
    return response.data;
  },

  getEmployeesByDepartment: async (departmentId) => {
    const response = await api.get(`/employees/department/${departmentId}`);
    return response.data;
  },


  deactivateEmployee: async (employeeId) => {
    const response = await api.post(`/employees/${employeeId}/deactivate`);
    return response.data;
  },

  suggestRoutes: async (location) => {
    const response = await api.get(`/employees/suggest-routes`, {
      params: { location },
    });
    return response.data;
  },

  getEmployeeStats: async () => {
    try {
      const response = await api.get('/employees/management');
      const employees = response.data || [];
      
      // Calculate basic stats from employee data
      const total = employees.length;
      const assigned = employees.filter(emp => emp.departmentId).length;
      const departments = new Set(employees.map(emp => emp.departmentId).filter(Boolean)).size;
      const recentlyAdded = employees.filter(emp => {
        const createdAt = new Date(emp.createdAt);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return createdAt > weekAgo;
      }).length;

      return {
        total,
        assigned,
        departments,
        recentlyAdded
      };
    } catch (error) {
      console.error('Error fetching employee stats:', error);
      // Return default stats if API fails
      return {
        total: 0,
        assigned: 0,
        departments: 0,
        recentlyAdded: 0
      };
    }
  },
};

export const {
  getAllEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  getEmployeesByCompany,
  getEmployeesByDepartment,
  deactivateEmployee,
  suggestRoutes,
  getEmployeeStats,
} = employeeService;

export { employeeService };
export default employeeService; 