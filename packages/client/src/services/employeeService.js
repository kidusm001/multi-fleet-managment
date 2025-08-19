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
} = employeeService;

export default employeeService; 