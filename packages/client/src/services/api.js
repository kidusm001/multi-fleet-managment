import axios from 'axios';

export const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  withCredentials: true, // Include cookies for authentication
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error);
    if (error.code === 'ERR_NETWORK') {
      throw new Error('Network error: Please check if the backend server is running');
    }
    // Log the full error details
    if (error.response) {
      console.error('Error Response:', error.response.data);
      console.error('Error Details:', {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data,
        headers: error.response.headers
      });
    }
    throw error;
  }
);

// Shifts
export const getShifts = () => api.get('/shifts');
export const getShiftById = (id) => api.get(`/shifts/${id}`);

// Employees
export const getEmployees = () => api.get('/employees');
export const getUnassignedEmployeesByShift = (shiftId) => api.get(`/employees/shift/${Number(shiftId)}/unassigned`);
export const getEmployeeById = (id) => api.get(`/employees/${Number(id)}`);
export const updateEmployee = (id, data) => api.put(`/employees/${Number(id)}`, data);

// Routes
export const getRoutes = () => api.get('/routes');
export const getRoutesByShift = (shiftId) => api.get(`/routes/shift/${Number(shiftId)}`);
export const getRouteById = (id) => api.get(`/routes/${Number(id)}`);
export const createRoute = (data) => api.post('/routes', data);
export const updateRoute = (id, data) => api.put(`/routes/${Number(id)}`, data);
export const deleteRoute = (id) => api.delete(`/routes/${Number(id)}`);

// Shuttles
export const getShuttles = () => api.get('/shuttles');
export const getAvailableShuttles = () => api.get('/shuttles/available');
export const getShuttleById = (id) => api.get(`/shuttles/${Number(id)}`);
export const getShuttlesByCategory = (categoryId) => api.get(`/shuttles/category/${Number(categoryId)}`);

// Clustering
export const optimizeClusters = (shiftId, date, shuttles) =>
  api.post('/fastapi/clusters/optimize', {
    shift_id: shiftId,
    date: date,
    shuttles: shuttles.map(s => ({
      id: s.id,
      capacity: s.capacity,
      category: s.category,
      location: s.location
    }))
  });

export const getClusterForShuttle = (shiftId, date, shuttleId) =>
  api.post(`/fastapi/clusters/shuttle/${shuttleId}`, {
    shift_id: shiftId,
    date: date,
    include_route: true
  });

export const getOptimalRoute = (employees) =>
  api.post('/fastapi/clusters/route/optimize', {
    employees: employees.map(emp => ({
      id: emp.id,
      location: emp.location,
      coordinates: {
        latitude: emp.stop?.latitude,
        longitude: emp.stop?.longitude
      },
      stop: emp.stop
    }))
  });

// Candidates
export const getAllCandidates = () => api.get('/candidates');
export const getCandidateById = (id) => api.get(`/candidates/${id}`);
export const createCandidate = (data) => api.post('/candidates', data);
export const createCandidatesInBatch = (data) => api.post('/candidates/batch', data);
export const updateCandidate = (id, data) => api.put(`/candidates/${id}`, data);
export const updateCandidateStatus = (id, status, reviewedById) => 
  api.patch(`/candidates/${id}/status`, { status, reviewedById });
export const deleteCandidate = (id) => api.delete(`/candidates/${id}`);

// Batches
export const getAllBatches = () => api.get('/batches');
export const getBatchById = (id) => api.get(`/batches/${id}`);
export const createBatch = (data) => api.post('/batches', data);
export const updateBatch = (id, data) => api.put(`/batches/${id}`, data);
export const updateBatchStatus = (id, status) => api.patch(`/batches/${id}/status`, { status });
export const deleteBatch = (id) => api.delete(`/batches/${id}`);

// Departments
export const getDepartments = () => api.get('/departments');
export const getDepartmentById = (id) => api.get(`/departments/${Number(id)}`);
export const createDepartment = (data) => api.post('/departments', data);
export const updateDepartment = (id, data) => api.patch(`/departments/${Number(id)}`, data);
export const deleteDepartment = (id) => api.delete(`/departments/${Number(id)}`);
export const getDepartmentEmployees = (id) => api.get(`/departments/${Number(id)}/employees`);

export default api;