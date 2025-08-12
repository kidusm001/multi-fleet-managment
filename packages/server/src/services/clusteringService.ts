export const clusteringService = {
  async getOptimalClusters(_shiftId: string, _date: Date, vehicles: Array<{ id: string | number; capacity: number }>) {
    // Return a basic structure for now
    return { clusters: vehicles.map((v) => ({ vehicleId: String(v.id), capacity: v.capacity, stops: [] })) };
  },
  async getOptimalClusterForShuttle(_shiftId: string, _date: Date, _shuttleId: number | string) {
    return { vehicleId: String(_shuttleId), capacity: 0, stops: [] };
  },
};

// No default export; use only named export
