import api from './api';

class ShuttleService {
  constructor() {
    this.cache = new Map();
    this.pendingRequests = new Map();
    this.cacheTimeout = 2 * 60 * 1000; // 2 minutes cache timeout
    this.pendingUpdates = new Map(); // Track pending updates by shuttleId
  }

  dispatchEvent(eventName, shuttleId) {
    window.dispatchEvent(new CustomEvent(eventName, {
      detail: { shuttleId }
    }));
  }

  // Helper function to debounce updates
  async debounceUpdate(shuttleId, updateFn) {
    if (this.pendingUpdates.has(shuttleId)) {
      clearTimeout(this.pendingUpdates.get(shuttleId).timeoutId);
    }

    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(async () => {
        this.pendingUpdates.delete(shuttleId);
        try {
          const result = await updateFn();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      }, 300); // 300ms debounce

      this.pendingUpdates.set(shuttleId, { timeoutId, resolve, reject });
    });
  }

  async getShuttles() {
    return this.handleCachedRequest('shuttles', async () => {
      const response = await api.get('/shuttles');
      return response.data;
    });
  }

  async getMaintenanceSchedule() {
    return this.handleCachedRequest('maintenance', async () => {
      try {
        const response = await api.get('/shuttles');
        // Filter and transform the data locally to avoid additional API call
        return response.data
          .filter(shuttle => shuttle.status === 'maintenance')
          .map(shuttle => ({
            ...shuttle,
            maintenanceStartDate: shuttle.lastMaintenance,
            expectedEndDate: shuttle.nextMaintenance,
            maintenanceDuration: shuttle.nextMaintenance && shuttle.lastMaintenance ?
              Math.ceil((new Date(shuttle.nextMaintenance).getTime() - new Date(shuttle.lastMaintenance).getTime()) / (1000 * 60 * 60 * 24)) :
              null
          }));
      } catch (error) {
        console.error('Error fetching maintenance schedule:', error);
        throw error;
      }
    });
  }

  async updateShuttle(id, updates) {
    this.clearCache();

    const updateFn = async () => {
      try {
        // Handle status updates (keep this branch unchanged for maintenance functionality)
        if ('status' in updates && !updates.name) {
          const statusData = { status: updates.status };
          if (updates.status === 'maintenance') {
            statusData.lastMaintenance = new Date().toISOString();
            statusData.nextMaintenance = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
          }
          
          const response = await api.patch(`/shuttles/${id}/status`, statusData);
          this.dispatchEvent('shuttle:status-updated', id);
          return response.data;
        }

        // Format the update data with strict type handling
        const formattedData = {};
        
        // Only include fields that are actually being updated
        if (updates.name !== undefined) formattedData.name = updates.name.trim();
        if (updates.model !== undefined) formattedData.model = updates.model.trim();
        if (updates.licensePlate !== undefined) formattedData.licensePlate = updates.licensePlate.trim().toUpperCase();
        if (updates.categoryId !== undefined) formattedData.categoryId = Number(updates.categoryId);
        if (updates.type !== undefined) formattedData.type = updates.type;
        if (updates.vendor !== undefined) formattedData.vendor = updates.type === 'outsourced' ? updates.vendor.trim() : null;
        if (updates.dailyRate !== undefined) formattedData.dailyRate = Number(updates.dailyRate || 0);

        console.log('Sending formatted data:', formattedData);
        
        const response = await api.put(`/shuttles/${id}`, formattedData);
        this.dispatchEvent('shuttle:edited', id);
        return response.data;
      } catch (error) {
        console.error('Error updating shuttle:', error);
        throw error;
      }
    };

    return this.debounceUpdate(id, updateFn);
  }

  async createShuttle(shuttleData) {
    // Clear cache when creating
    this.clearCache();

    console.log('Sending shuttle data to API:', shuttleData);
    try {
      // Ensure capacity is a number and status is included
      const formattedData = {
        ...shuttleData,
        capacity: parseInt(shuttleData.capacity),
        status: shuttleData.status || 'active',
        dailyRate: parseFloat(shuttleData.dailyRate)
      };

      const response = await api.post('/shuttles', formattedData);
      return response.data;
    } catch (error) {
      console.error('Error response:', error.response?.data);
      console.error('Error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
      });
      throw error;
    }
  }

  async deleteShuttle(id) {
    // Clear cache when deleting
    this.clearCache();

    const response = await api.delete(`/shuttles/${id}`);
    return response.data;
  }

  async requestShuttle(shuttleData) {
    try {
      console.log("Sending shuttle request data:", shuttleData);
      const response = await api.post('/shuttle-requests', shuttleData);
      return response.data;
    } catch (error) {
      console.error('Error requesting shuttle:', error);
      throw error;
    }
  }

  async getPendingShuttleRequests() {
    try {
      const response = await api.get('/shuttle-requests/pending');
      return response.data;
    } catch (error) {
      console.error('Error fetching pending shuttle requests:', error);
      throw error;
    }
  }

  async approveShuttleRequest(id) {
    try {
      const response = await api.post(`/shuttle-requests/${id}/approve`);
      return response.data;
    } catch (error) {
      console.error('Error approving shuttle request:', error);
      throw error;
    }
  }

  async rejectShuttleRequest(id, comment) {
    try {
      const response = await api.post(`/shuttle-requests/${id}/reject`, { comment });
      return response.data;
    } catch (error) {
      console.error('Error rejecting shuttle request:', error);
      throw error;
    }
  }

  // Private helper methods for caching
  async handleCachedRequest(key, requestFn) {
    // Check cache first
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    // Check if there's a pending request
    if (this.pendingRequests.has(key)) {
      return this.pendingRequests.get(key);
    }

    // Make new request
    const promise = requestFn().then(data => {
      this.cache.set(key, {
        data,
        timestamp: Date.now()
      });
      this.pendingRequests.delete(key);
      return data;
    }).catch(error => {
      this.pendingRequests.delete(key);
      throw error;
    });

    this.pendingRequests.set(key, promise);
    return promise;
  }

  clearCache() {
    this.cache.clear();
  }

  invalidateCache(key) {
    if (key) {
      this.cache.delete(key);
    } else {
      this.cache.clear();
    }
  }
}

export const shuttleService = new ShuttleService();

export const updateShuttle = async (shuttle) => {
  const response = await fetch(`/api/shuttles/${shuttle.id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(shuttle)
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText);
  }
  return response.json();
};