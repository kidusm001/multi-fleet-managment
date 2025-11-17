import axios from 'axios';
import { isDev, getApiUrl } from '../utils/env';

// Build API base: Use proxy in dev mode, full URL in production
const API_BASE = isDev()
  ? '/api'  // Use Vite's proxy in development
  : `${getApiUrl().replace(/\/$/, '')}/api`;

export const api = axios.create({
  baseURL: API_BASE,
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
    if (error.code === 'ERR_NETWORK') {
      console.error('API Network Error:', error);
      throw new Error('Network error: Please check if the backend server is running');
    }
    
    if (error.response) {
      // Check if this is an HTML 404 response and convert it to a proper 404 error
      if (error.response.status === 404 && 
          typeof error.response.data === 'string' && 
          error.response.data.includes('<html')) {
        const jsonError = {
          ...error,
          response: {
            ...error.response,
            data: { error: 'Not Found', message: 'Endpoint not found' },
            status: 404,
            statusText: 'Not Found'
          }
        };
        throw jsonError;
      }

      // Only log non-404 errors (404s are expected for missing endpoints)
      if (error.response.status !== 404) {
        console.error('API Error:', error);
        console.error('Error Response:', error.response.data);
        console.error('Error Details:', {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data,
          headers: error.response.headers
        });
      }

  // Global auth handling: redirect to login on 401 from API calls
      if (error.response.status === 401 && typeof window !== 'undefined') {
        try {
          const { pathname, search, hash } = window.location;
          // Avoid redirect loop if we're already on the login page
          if (!pathname.startsWith('/auth/login')) {
            const next = `${pathname}${search || ''}${hash || ''}`;
            const target = `/auth/login?next=${encodeURIComponent(next)}`;
            window.location.assign(target);
          }
        } catch (_) {
          // ignore any window access errors in non-browser contexts
        }
      }
      // For 403 Forbidden, do NOT automatically redirect application-wide.
      // Background API calls (notifications, counts) may return 403 when the
      // user lacks a specific permission — let the calling component decide
      // how to handle it (e.g., show a message or hide a feature) instead
      // of forcing navigation which breaks SPA flows.
      if (error.response.status === 403) {
        console.warn('API Forbidden (403) — caller should handle this:', error.response.data);
        // fall through to rethrow the error so components can handle it
      }
    }
    throw error;
  }
);

// Shifts
export const getShifts = () => api.get('/shifts');
export const getShiftById = (id) => api.get(`/shifts/${id}`);

// Employees
export const getEmployees = () => api.get('/employees');
export const getUnassignedEmployeesByShift = (shiftId) => {
  if (!shiftId || typeof shiftId !== 'string' || shiftId.trim() === '' || shiftId === 'NaN') {
    throw new Error('Invalid shift ID provided');
  }
  return api.get(`/employees/shift/${shiftId}/unassigned`);
};
export const getEmployeeById = (id) => api.get(`/employees/${id}`);
export const updateEmployee = (id, data) => api.put(`/employees/${id}`, data);

// Routes
export const getRoutes = () => api.get('/routes');
export const getRoutesByShift = (shiftId) => {
  if (!shiftId || typeof shiftId !== 'string' || shiftId.trim() === '' || shiftId === 'NaN') {
    throw new Error('Invalid shift ID provided');
  }
  return api.get(`/routes/shift/${shiftId}`);
};
export const getRouteById = (id) => api.get(`/routes/${id}`);
export const createRoute = (data) => api.post('/routes', data);
export const updateRoute = (id, data) => api.put(`/routes/${id}`, data);
export const deleteRoute = (id) => api.delete(`/routes/${id}`);

// Shuttles
export const getShuttles = () => api.get('/shuttles');
export const getAvailableShuttles = () => api.get('/shuttles/available');
export const getShuttleById = (id) => api.get(`/shuttles/${id}`);
export const getShuttlesByCategory = (categoryId) => api.get(`/shuttles/category/${categoryId}`);

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


// Departments
export const getDepartments = () => api.get('/departments');
export const getDepartmentById = (id) => api.get(`/departments/${id}`);
export const createDepartment = (data) => api.post('/departments', data);
export const updateDepartment = (id, data) => api.patch(`/departments/${id}`, data);
export const deleteDepartment = (id) => api.delete(`/departments/${id}`);
export const getDepartmentEmployees = (id) => api.get(`/departments/${id}/employees`);

// Locations
export const getLocations = (type) => api.get('/locations', { params: type ? { type } : {} });
export const getLocationById = (id) => api.get(`/locations/${id}`);
export const createLocation = (data) => api.post('/locations', data);
export const updateLocation = (id, data) => api.put(`/locations/${id}`, data);
export const deleteLocation = (id) => api.delete(`/locations/${id}`);
export const getLocationEmployees = (id) => api.get(`/locations/${id}/employees`);
export const getLocationRoutes = (id) => api.get(`/locations/${id}/routes`);

export default api;