import {
  routeService,
  employeeService,
  clusterService,
  shuttleAvailabilityService
} from '../index';

// These integration tests require a live backend. Skip by default unless RUN_LIVE_API_TESTS=true
const runLive = process.env.RUN_LIVE_API_TESTS === 'true';

const maybeDescribe = runLive ? describe : describe.skip;

maybeDescribe('Service Integration Tests (live backend)', () => {
  // Test data
  const testShiftId = '1';
  const testShuttleId = '1';
  const testDate = new Date().toISOString();

  describe('Route Service', () => {
    test('should get all routes', async () => {
      const routes = await routeService.getAllRoutes();
      expect(Array.isArray(routes)).toBe(true);
    });

    test('should get routes by shift', async () => {
      const routes = await routeService.getRoutesByShift(testShiftId);
      expect(Array.isArray(routes)).toBe(true);
    });
  });

  describe('Cluster Service', () => {
    test('should get optimal clusters', async () => {
      const clusters = await clusterService.getOptimalClusters(testShiftId, testDate);
      expect(clusters).toBeDefined();
    });

    test('should check shuttle availability', async () => {
      const availability = await clusterService.checkShuttleAvailability(
        testShuttleId,
        testShiftId,
        testDate
      );
      expect(availability).toBeDefined();
    });
  });

  describe('Shuttle Availability Service', () => {
    test('should get all availabilities', async () => {
      const availabilities = await shuttleAvailabilityService.getAllAvailabilities();
      expect(Array.isArray(availabilities)).toBe(true);
    });

    test('should get availability by shuttle and shift', async () => {
      const availability = await shuttleAvailabilityService.getAvailabilityByShuttleAndShift(
        testShuttleId,
        testShiftId
      );
      expect(availability).toBeDefined();
    });
  });

  describe('Employee Service', () => {
    test('should get unassigned employees by shift', async () => {
      const employees = await employeeService.getUnassignedEmployeesByShift(testShiftId);
      expect(Array.isArray(employees)).toBe(true);
    });
  });
}); 