import { vi } from 'vitest';
import { Role, VehicleStatus, RouteStatus, NotificationType, NotificationStatus, DriverStatus, VehicleType, LocationType, ApprovalStatus } from '@prisma/client';

export const mockOrganization = (overrides = {}) => ({
  id: 'org_test_123',
  name: 'Test Organization',
  slug: 'test-org',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  ...overrides,
});

export const mockUser = (overrides = {}) => ({
  id: 'user_test_123',
  email: 'test@example.com',
  name: 'Test User',
  emailVerified: false,
  image: null,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  banned: false,
  banReason: null,
  banExpires: null,
  ...overrides,
});

export const mockSession = (overrides = {}) => ({
  id: 'session_test_123',
  userId: 'user_test_123',
  expiresAt: new Date(Date.now() + 86400000),
  token: 'mock_session_token',
  ipAddress: '127.0.0.1',
  userAgent: 'test-agent',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  ...overrides,
});

export const mockOrganizationMember = (overrides = {}) => ({
  id: 'member_test_123',
  organizationId: 'org_test_123',
  userId: 'user_test_123',
  role: Role.admin,
  createdAt: new Date('2024-01-01'),
  ...overrides,
});

export const mockLocation = (overrides = {}) => ({
  id: 'loc_test_123',
  address: '123 Test St, Test City',
  latitude: 40.7128,
  longitude: -74.0060,
  type: LocationType.BRANCH,
  organizationId: 'org_test_123',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  ...overrides,
});

export const mockDepartment = (overrides = {}) => ({
  id: 'dept_test_123',
  name: 'Engineering',
  organizationId: 'org_test_123',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  ...overrides,
});

export const mockEmployee = (overrides = {}) => ({
  id: 'emp_test_123',
  firstName: 'John',
  lastName: 'Doe',
  email: 'john.doe@example.com',
  phoneNumber: '+1234567890',
  departmentId: 'dept_test_123',
  locationId: 'loc_test_123',
  organizationId: 'org_test_123',
  stopId: null,
  deleted: false,
  deletedAt: null,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  ...overrides,
});

export const mockVehicleCategory = (overrides = {}) => ({
  id: 'cat_test_123',
  name: 'Standard Van',
  capacity: 12,
  organizationId: 'org_test_123',
  deleted: false,
  deletedAt: null,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  ...overrides,
});

export const mockVehicle = (overrides = {}) => ({
  id: 'veh_test_123',
  plateNumber: 'ABC-123',
  model: 'Ford Transit',
  capacity: 12,
  status: VehicleStatus.AVAILABLE,
  type: VehicleType.IN_HOUSE,
  categoryId: 'cat_test_123',
  organizationId: 'org_test_123',
  vendor: null,
  dailyRate: null,
  lastMaintenance: null,
  nextMaintenance: null,
  deleted: false,
  deletedAt: null,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  ...overrides,
});

export const mockDriver = (overrides = {}) => ({
  id: 'drv_test_123',
  firstName: 'Jane',
  lastName: 'Driver',
  email: 'jane.driver@example.com',
  phoneNumber: '+1234567891',
  licenseNumber: 'DL123456',
  status: DriverStatus.ACTIVE,
  organizationId: 'org_test_123',
  deleted: false,
  deletedAt: null,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  ...overrides,
});

export const mockShift = (overrides = {}) => ({
  id: 'shift_test_123',
  name: 'Morning Shift',
  startTime: new Date('2024-01-01T08:00:00Z'),
  endTime: new Date('2024-01-01T17:00:00Z'),
  timeZone: 'America/New_York',
  organizationId: 'org_test_123',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  ...overrides,
});

export const mockRoute = (overrides = {}) => ({
  id: 'route_test_123',
  name: 'Route A',
  shiftId: 'shift_test_123',
  driverId: 'drv_test_123',
  vehicleId: 'veh_test_123',
  locationId: 'loc_test_123',
  status: RouteStatus.ACTIVE,
  organizationId: 'org_test_123',
  deleted: false,
  deletedAt: null,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  ...overrides,
});

export const mockStop = (overrides = {}) => ({
  id: 'stop_test_123',
  name: 'Stop 1',
  address: '456 Stop Ave',
  latitude: 40.7589,
  longitude: -73.9851,
  order: 1,
  estimatedArrival: new Date('2024-01-01T08:30:00Z'),
  routeId: 'route_test_123',
  locationId: 'loc_test_123',
  organizationId: 'org_test_123',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  ...overrides,
});

export const mockNotification = (overrides = {}) => ({
  id: 'notif_test_123',
  title: 'Test Notification',
  message: 'This is a test notification',
  type: NotificationType.INFO,
  status: NotificationStatus.UNREAD,
  userId: 'user_test_123',
  organizationId: 'org_test_123',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  ...overrides,
});

export const mockVehicleRequest = (overrides = {}) => ({
  id: 'req_test_123',
  vehicleId: 'veh_test_123',
  requestedBy: 'user_test_123',
  status: ApprovalStatus.PENDING,
  requestDate: new Date('2024-01-01'),
  reason: 'Business trip',
  organizationId: 'org_test_123',
  approvedBy: null,
  approvedAt: null,
  rejectedBy: null,
  rejectedAt: null,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  ...overrides,
});

const createModelMock = (methods: string[]) => {
  const mock: Record<string, ReturnType<typeof vi.fn>> = {};
  for (const method of methods) {
    mock[method] = vi.fn();
  }
  return mock;
};

export const createMockPrismaClient = () => {
  const client: Record<string, any> = {
    organization: createModelMock(['findUnique', 'findFirst', 'findMany', 'create', 'update', 'updateMany', 'delete', 'deleteMany']),
    user: createModelMock(['findUnique', 'findFirst', 'findMany', 'create', 'update', 'updateMany', 'delete', 'deleteMany']),
    session: createModelMock(['findUnique', 'findFirst', 'findMany', 'create', 'update', 'delete']),
    organizationMember: createModelMock(['findUnique', 'findFirst', 'findMany', 'create', 'update', 'delete']),
    location: createModelMock(['findUnique', 'findFirst', 'findMany', 'create', 'update', 'updateMany', 'delete', 'deleteMany']),
    department: createModelMock(['findUnique', 'findFirst', 'findMany', 'create', 'update', 'delete']),
    employee: createModelMock(['findUnique', 'findFirst', 'findMany', 'create', 'update', 'updateMany', 'delete', 'deleteMany', 'count']),
    vehicle: createModelMock(['findUnique', 'findFirst', 'findMany', 'create', 'update', 'updateMany', 'delete', 'deleteMany', 'count']),
    vehicleCategory: createModelMock(['findUnique', 'findFirst', 'findMany', 'create', 'update', 'delete']),
    driver: createModelMock(['findUnique', 'findFirst', 'findMany', 'create', 'update', 'updateMany', 'delete', 'deleteMany']),
    shift: createModelMock(['findUnique', 'findFirst', 'findMany', 'create', 'update', 'updateMany', 'delete', 'deleteMany']),
    route: createModelMock(['findUnique', 'findFirst', 'findMany', 'create', 'update', 'updateMany', 'delete', 'deleteMany', 'count']),
    stop: createModelMock(['findUnique', 'findFirst', 'findMany', 'create', 'update', 'updateMany', 'delete', 'deleteMany']),
    notification: createModelMock(['findUnique', 'findFirst', 'findMany', 'create', 'update', 'updateMany', 'delete', 'deleteMany']),
    vehicleRequest: createModelMock(['findUnique', 'findFirst', 'findMany', 'create', 'update', 'delete']),
    vehicleAvailability: createModelMock(['findUnique', 'findFirst', 'findMany', 'create', 'update', 'updateMany', 'delete', 'deleteMany', 'upsert']),
  };

  client.$transaction = vi.fn(async (arg: any, _options?: any) => {
    if (typeof arg === 'function') {
      return arg(client);
    }

    if (Array.isArray(arg)) {
      return Promise.all(arg);
    }

    return arg;
  });

  return client;
};
