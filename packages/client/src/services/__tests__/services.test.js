// These integration tests require a live backend. We purposely gate *imports* behind the flag
// so that axios instances hitting a non-existent server don't run during normal unit test runs.
const runLive = process.env.RUN_LIVE_API_TESTS === 'true';

if (!runLive) {
  // Provide a skipped suite placeholder for visibility
  describe.skip('Service Integration Tests (live backend)', () => {
    test('skipped (set RUN_LIVE_API_TESTS=true to enable)', () => {});
  });
} else {
  const {
    routeService,
    employeeService,
    clusterService,
    shuttleAvailabilityService
  } = await import('../index');

  describe('Service Integration Tests (live backend)', () => {
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
}