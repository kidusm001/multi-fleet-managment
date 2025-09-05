import axios from 'axios';

function resolveEnv() {
  try {
    if (typeof import.meta !== 'undefined' && import.meta.env) return import.meta.env;
  } catch (_) { /* ignore */ }
  const g = globalThis;
  return (g.__IMETA && g.__IMETA.env) || g.importMetaEnv || {};
}
const env = resolveEnv();

// Create a separate axios instance for FastAPI requests
const ORIGIN = env.VITE_API_BASE || env.VITE_API_URL || 'http://localhost:3001';
const BASE = env.DEV ? '/api' : `${ORIGIN.replace(/\/$/, '')}/api`;
const fastApi = axios.create({
  baseURL: BASE, // Express backend mounts FastAPI under /fastapi
  timeout: 60000, // Increased timeout to 60 seconds
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Global 401 handling for clustering requests
fastApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      const { pathname, search, hash } = window.location;
      if (!pathname.startsWith('/auth/login')) {
        const next = `${pathname}${search || ''}${hash || ''}`;
        const target = `/auth/login?next=${encodeURIComponent(next)}`;
        window.location.assign(target);
      }
    }
    if (error.response?.status === 403 && typeof window !== 'undefined') {
      if (!window.location.pathname.startsWith('/unauthorized')) {
        window.location.assign('/unauthorized');
      }
    }
    return Promise.reject(error);
  }
);

// Store the current request cancel token
let currentOptimizeRequest = null;
let isRequestInProgress = false;

export const clusterService = {
  // Get optimal clusters for multiple shuttles
  optimizeClusters: async (employees, shuttles) => {
    try {
      // If a request is already in progress, don't start another one
      if (isRequestInProgress) {
        console.log('Request already in progress, skipping...');
        return {};
      }

      // Calculate total shuttle capacity
      const totalCapacity = shuttles.reduce((sum, shuttle) =>
        sum + (shuttle.category?.capacity || 0), 0);

      // Check if total employees exceed capacity
      if (employees.length > totalCapacity) {
        console.log(`Total employees (${employees.length}) exceed total shuttle capacity (${totalCapacity})`);

        // Get unique departments
        const departments = [...new Set(employees.map(emp => emp.department?.name))];
        // Randomly shuffle departments
        const shuffledDepts = departments.sort(() => Math.random() - 0.5);

        let selectedEmployees = [];
        let selectedDepartments = [];

        // Add employees department by department until we reach capacity
        for (const dept of shuffledDepts) {
          const deptEmployees = employees.filter(emp => emp.department?.name === dept);
          if (selectedEmployees.length + deptEmployees.length <= totalCapacity) {
            selectedEmployees = [...selectedEmployees, ...deptEmployees];
            selectedDepartments.push(dept);
          }
        }

        // If still over capacity, don't proceed
        if (selectedEmployees.length > totalCapacity) {
          return {
            error: 'capacity_exceeded',
            message: `Total employees (${employees.length}) exceed shuttle capacity (${totalCapacity})`,
            totalEmployees: employees.length,
            totalCapacity: totalCapacity,
            selectedDepartments: []
          };
        }

        // Use filtered employees for clustering
        employees = selectedEmployees;
        console.log('Selected departments for clustering:', selectedDepartments);
      }

      // Cancel any existing request
      if (currentOptimizeRequest) {
        currentOptimizeRequest.cancel('New request started');
      }

      // Create new cancel token
      currentOptimizeRequest = axios.CancelToken.source();
      isRequestInProgress = true;

      // Format request data
      const requestData = {
        locations: {
          HQ: [9.0222, 38.7468], // Addis Ababa coordinates as HQ
          employees: employees.map(emp => ({
            id: emp.id.toString(),
            latitude: emp.stop?.latitude || 0,
            longitude: emp.stop?.longitude || 0
          }))
        },
        shuttles: shuttles.map(shuttle => ({
          id: shuttle.id,
          capacity: shuttle.category?.capacity || 0
        }))
      };

      try {
        const response = await fastApi.post('/fastapi/clustering', requestData, {
          cancelToken: currentOptimizeRequest.token
        });
        currentOptimizeRequest = null;
        isRequestInProgress = false;
        const result = handleClusterResponse(response, employees, shuttles);
        return {
          ...result,
          totalEmployees: employees.length,
          totalCapacity: totalCapacity,
          selectedDepartments: employees.length < totalCapacity ? [] :
            [...new Set(employees.map(emp => emp.department?.name))]
        };
      } catch (error) {
        if (axios.isCancel(error)) {
          throw error;
        }
        throw error;
      }
    } catch (error) {
      // Ignore cancelled request errors
      if (axios.isCancel(error)) {
        console.log('Request cancelled:', error.message);
        return {};
      }
      console.error('Error optimizing clusters:', error);
      return {};
    } finally {
      isRequestInProgress = false;
    }
  },

  // Get cluster for a single shuttle
  getShuttleCluster: async (shiftId, shuttleId, date) => {
    try {
      const response = await fastApi.post(`/fastapi/clusters/shuttle/${shuttleId}`, {
        shift_id: shiftId,
        date: date,
        include_route: true
      });
      return response.data;
    } catch (error) {
      console.error('Error getting shuttle cluster:', error);
      return { employees: [] };
    }
  }
};

// Helper function to handle cluster response
function handleClusterResponse(response, employees, shuttles) {
  if (response.data.success) {
    const clustersByShuttle = {};

    // Initialize empty arrays for all shuttles
    shuttles.forEach(shuttle => {
      clustersByShuttle[shuttle.id] = [];
    });

    // Populate assigned employees for each shuttle
    response.data.routes.forEach(route => {
      const shuttleId = route.shuttle_id;
      const assignedEmployees = employees.filter(emp =>
        route.employees.includes(emp.id.toString())
      );
      clustersByShuttle[shuttleId] = assignedEmployees;
    });

    return clustersByShuttle;
  }
  return {};
}

export default clusterService; 