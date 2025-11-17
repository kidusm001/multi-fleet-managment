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

  // Helper method to map frontend vehicle types to backend schema
  mapVehicleType(type) {
    const typeMap = {
      'in-house': 'IN_HOUSE',
      'in_house': 'IN_HOUSE',
      'outsourced': 'OUTSOURCED',
      'IN_HOUSE': 'IN_HOUSE',
      'OUTSOURCED': 'OUTSOURCED'
    };
    return typeMap[type] || 'IN_HOUSE';
  }

  // Helper method to map frontend vehicle status to backend schema
  mapVehicleStatus(status) {
    const statusMap = {
      'active': 'AVAILABLE',
      'available': 'AVAILABLE',
      'in-use': 'IN_USE',
      'in_use': 'IN_USE',
      'maintenance': 'MAINTENANCE',
      'out-of-service': 'OUT_OF_SERVICE',
      'out_of_service': 'OUT_OF_SERVICE',
      'inactive': 'INACTIVE',
      'AVAILABLE': 'AVAILABLE',
      'IN_USE': 'IN_USE',
      'MAINTENANCE': 'MAINTENANCE',
      'OUT_OF_SERVICE': 'OUT_OF_SERVICE',
      'INACTIVE': 'INACTIVE'
    };
    return statusMap[status] || 'AVAILABLE';
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
          .filter(shuttle => shuttle.status?.toLowerCase() === 'maintenance')
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
          const statusData = { status: this.mapVehicleStatus(updates.status) };
          if (updates.status === 'maintenance') {
            statusData.lastMaintenance = new Date().toISOString();
            statusData.nextMaintenance = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
          }
          
          const response = await api.patch(`/shuttles/${id}/status`, statusData);
          this.dispatchEvent('shuttle:status-updated', id);
          return response.data;
        }

        // Format the update data according to vehicle schema
        const formattedData = {};
        
        // Only include fields that are actually being updated
        if (updates.name !== undefined) formattedData.name = updates.name.trim();
        if (updates.model !== undefined) formattedData.model = updates.model.trim();
        if (updates.plateNumber !== undefined) formattedData.plateNumber = updates.plateNumber.trim().toUpperCase();
        if (updates.licensePlate !== undefined) formattedData.plateNumber = updates.licensePlate.trim().toUpperCase(); // Map licensePlate to plateNumber
        if (updates.make !== undefined) formattedData.make = updates.make.trim();
        if (updates.capacity !== undefined) formattedData.capacity = Number(updates.capacity);
        if (updates.year !== undefined) formattedData.year = Number(updates.year);
        if (updates.categoryId !== undefined) formattedData.categoryId = updates.categoryId;
        if (updates.driverId !== undefined) formattedData.driverId = updates.driverId;
        if (updates.type !== undefined) formattedData.type = this.mapVehicleType(updates.type);
        if (updates.vendor !== undefined) formattedData.vendor = this.mapVehicleType(updates.type) === 'OUTSOURCED' ? updates.vendor.trim() : null;
        if (updates.dailyRate !== undefined) formattedData.dailyRate = Number(updates.dailyRate || 0);
        if (updates.status !== undefined) formattedData.status = this.mapVehicleStatus(updates.status);
        if (updates.lastMaintenance !== undefined) formattedData.lastMaintenance = updates.lastMaintenance;
        if (updates.nextMaintenance !== undefined) formattedData.nextMaintenance = updates.nextMaintenance;

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
      // Format data according to vehicle schema requirements
      const formattedData = {
        plateNumber: shuttleData.plateNumber?.trim() || shuttleData.licensePlate?.trim(), // Handle both field names
        model: shuttleData.model?.trim(),
        capacity: parseInt(shuttleData.capacity),
        // Optional fields
        name: shuttleData.name?.trim() || undefined,
        make: shuttleData.make?.trim() || undefined,
        type: this.mapVehicleType(shuttleData.type) || 'IN_HOUSE', // Map and default to IN_HOUSE
        vendor: shuttleData.vendor?.trim() || undefined,
        year: shuttleData.year ? parseInt(shuttleData.year) : undefined,
        status: this.mapVehicleStatus(shuttleData.status) || 'AVAILABLE', // Map and default to AVAILABLE
        dailyRate: shuttleData.dailyRate ? parseFloat(shuttleData.dailyRate) : undefined,
        categoryId: shuttleData.categoryId || undefined,
        driverId: shuttleData.driverId || undefined,
        lastMaintenance: shuttleData.lastMaintenance || undefined,
        nextMaintenance: shuttleData.nextMaintenance || undefined
      };

      // Remove undefined values to avoid sending unnecessary fields
      Object.keys(formattedData).forEach(key => {
        if (formattedData[key] === undefined) {
          delete formattedData[key];
        }
      });

      console.log('Formatted data according to schema:', formattedData);

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
      const formattedData = {
        name: shuttleData.name?.trim(),
        licensePlate: shuttleData.licensePlate?.trim(),
        capacity: Number(shuttleData.capacity),
        type: this.mapVehicleType(shuttleData.type),
        model: shuttleData.model?.trim(),
        vendor: this.mapVehicleType(shuttleData.type) === 'OUTSOURCED'
          ? shuttleData.vendor?.trim() || undefined
          : undefined,
        dailyRate: shuttleData.dailyRate !== undefined && shuttleData.dailyRate !== null
          ? Number(shuttleData.dailyRate)
          : undefined,
        categoryId: shuttleData.categoryId || undefined,
        requestedBy: shuttleData.requestedBy,
      };

      if (!formattedData.requestedBy) {
        throw new Error('Requester information missing');
      }

      if (!formattedData.name || !formattedData.licensePlate || !Number.isFinite(formattedData.capacity)) {
        throw new Error('Missing required vehicle request fields');
      }

      Object.keys(formattedData).forEach((key) => {
        if (formattedData[key] === undefined || formattedData[key] === null || formattedData[key] === '') {
          delete formattedData[key];
        }
      });

      const response = await api.post('/vehicle-requests', formattedData);

      if (typeof window !== 'undefined') {
        try {
          window.dispatchEvent(new CustomEvent('vehicle-request:refresh', {
            detail: {
              request: response.data,
            },
          }));
        } catch (dispatchError) {
          console.error('Failed to dispatch vehicle request refresh event:', dispatchError);
        }
      }

      return response.data;
    } catch (error) {
      console.error('Error requesting shuttle:', error);
      throw error;
    }
  }

  async getPendingShuttleRequests() {
    try {
      const response = await api.get('/vehicle-requests/pending');
      return response.data;
    } catch (error) {
      console.error('Error fetching pending shuttle requests:', error);
      throw error;
    }
  }

  async approveShuttleRequest(id) {
    try {
      const response = await api.post(`/vehicle-requests/${id}/approve`);

      // Clear shuttle cache to force fresh data
      this.clearCache();

      if (typeof window !== 'undefined') {
        try {
          window.dispatchEvent(new CustomEvent('vehicle-request:refresh', {
            detail: { requestId: id, status: 'APPROVED' },
          }));
          window.dispatchEvent(new CustomEvent('shuttle:list-refresh'));
        } catch (dispatchError) {
          console.error('Failed to dispatch shuttle refresh event:', dispatchError);
        }
      }

      return response.data;
    } catch (error) {
      console.error('Error approving shuttle request:', error);
      throw error;
    }
  }

  async rejectShuttleRequest(id, comment) {
    try {
      const response = await api.post(`/vehicle-requests/${id}/reject`, { comment });

      // Clear shuttle cache
      this.clearCache();

      if (typeof window !== 'undefined') {
        try {
          window.dispatchEvent(new CustomEvent('vehicle-request:refresh', {
            detail: { requestId: id, status: 'REJECTED' },
          }));
        } catch (dispatchError) {
          console.error('Failed to dispatch vehicle request refresh event:', dispatchError);
        }
      }

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
  const response = await api.put(`/shuttles/${shuttle.id}`, shuttle);
  return response.data;
};