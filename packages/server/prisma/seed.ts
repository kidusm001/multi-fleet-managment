import { PrismaClient, ApprovalStatus, VehicleStatus, RouteStatus } from '@prisma/client'

const prisma = new PrismaClient()


async function upsertDefaultOrganization() {
  const organization = await prisma.organization.upsert({
    where: { slug: 'default-org' },
    update: { name: 'Default Organization' },
    create: { id: 'default-org', slug: 'default-org', name: 'Default Organization', createdAt: new Date() },
  });
  return organization;
}

async function main() {
  console.log('🌱 Starting database seeding...')

  const defaultOrg = await upsertDefaultOrganization();
  const acmeOrg = await prisma.organization.upsert({
    where: { slug: 'acme-logistics' },
    update: { name: 'ACME Logistics' },
    create: { id: 'acme-org', slug: 'acme-logistics', name: 'ACME Logistics', createdAt: new Date() },
  });
  console.log('✅ Organizations ready:', defaultOrg.name, 'and', acmeOrg.name)

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@demofleet.com' },
    update: { name: 'Admin User' },
    create: {
      id: 'user-admin-demofleet',
      email: 'admin@demofleet.com',
      name: 'Admin User',
      emailVerified: true,
      role: 'superadmin',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });
  const managerUser = await prisma.user.upsert({
    where: { email: 'manager@acme.com' },
    update: { name: 'ACME Manager' },
    create: {
      id: 'user-manager-acme',
      email: 'manager@acme.com',
      name: 'ACME Manager',
      emailVerified: true,
      role: 'user',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  await prisma.member.upsert({
    where: { id: `member-${adminUser.id}-${defaultOrg.id}` },
    update: { role: 'admin' },
    create: { id: `member-${adminUser.id}-${defaultOrg.id}`, userId: adminUser.id, organizationId: defaultOrg.id, role: 'admin', createdAt: new Date() },
  });
  await prisma.member.upsert({
    where: { id: `member-${managerUser.id}-${acmeOrg.id}` },
    update: { role: 'manager' },
    create: { id: `member-${managerUser.id}-${acmeOrg.id}`, userId: managerUser.id, organizationId: acmeOrg.id, role: 'manager', createdAt: new Date() },
  });
  console.log('✅ Users and members ready')

  // Departments
  const department = await prisma.department.upsert({
    where: { id: 'dept-default-ops' },
    update: { name: 'Operations', organizationId: defaultOrg.id },
    create: { id: 'dept-default-ops', name: 'Operations', organizationId: defaultOrg.id },
  })

  // Shifts
  const morningShift = await prisma.shift.upsert({
    where: { id: 'shift-morning' },
    update: {},
    create: {
      id: 'shift-morning',
      name: 'Morning Shift',
      startTime: new Date('2025-01-01T08:00:00Z'),
      endTime: new Date('2025-01-01T16:00:00Z'),
      timeZone: 'UTC',
      organizationId: defaultOrg.id,
    },
  })
  const eveningShift = await prisma.shift.upsert({
    where: { id: 'shift-evening' },
    update: {},
    create: {
      id: 'shift-evening',
      name: 'Evening Shift',
      startTime: new Date('2025-01-01T16:00:00Z'),
      endTime: new Date('2025-01-01T23:00:00Z'),
      timeZone: 'UTC',
      organizationId: defaultOrg.id,
    },
  })
  console.log('✅ Shifts ready')

  // Employees
  await prisma.employee.upsert({
    where: { id: 'emp-john' },
    update: { departmentId: department.id, shiftId: morningShift.id, organizationId: defaultOrg.id, userId: adminUser.id },
    create: { id: 'emp-john', name: 'John Employee', location: 'Main Office', departmentId: department.id, shiftId: morningShift.id, organizationId: defaultOrg.id, userId: adminUser.id },
  })

  // Drivers
  const driver = await prisma.driver.upsert({
    where: { licenseNumber: 'DL123456789' },
    update: { name: 'John Driver', organizationId: defaultOrg.id, isActive: true },
    create: { name: 'John Driver', email: 'driver@demofleet.com', phoneNumber: '+1-555-0124', licenseNumber: 'DL123456789', experienceYears: 5, isActive: true, organizationId: defaultOrg.id },
  })
  const driver2 = await prisma.driver.upsert({
    where: { licenseNumber: 'DL987654321' },
    update: { name: 'Jane Driver', organizationId: defaultOrg.id, isActive: true },
    create: { name: 'Jane Driver', email: 'jane@demofleet.com', phoneNumber: '+1-555-0456', licenseNumber: 'DL987654321', experienceYears: 3, isActive: true, organizationId: defaultOrg.id },
  })
  console.log('✅ Drivers ready')

  // Vehicle categories
  const standardCat = await prisma.vehicleCategory.upsert({
    where: { id: 'cat-standard' },
    update: { name: 'Standard Shuttle', capacity: 14, organizationId: defaultOrg.id },
    create: { id: 'cat-standard', name: 'Standard Shuttle', capacity: 14, organizationId: defaultOrg.id },
  })
  const coasterCat = await prisma.vehicleCategory.upsert({
    where: { id: 'cat-coaster' },
    update: { name: 'Toyota Coaster', capacity: 22, organizationId: defaultOrg.id },
    create: { id: 'cat-coaster', name: 'Toyota Coaster', capacity: 22, organizationId: defaultOrg.id },
  })
  console.log('✅ Vehicle categories ready')

  // Vehicles
  const vehicle = await prisma.vehicle.upsert({
    where: { plateNumber: 'ABC-123' },
    update: { name: 'Demo Shuttle 1', status: VehicleStatus.AVAILABLE, driverId: driver.id, categoryId: standardCat.id, organizationId: defaultOrg.id },
    create: { plateNumber: 'ABC-123', name: 'Demo Shuttle 1', model: 'Toyota Hiace', make: 'Toyota', year: 2022, capacity: 14, status: VehicleStatus.AVAILABLE, categoryId: standardCat.id, driverId: driver.id, organizationId: defaultOrg.id },
  })
  await prisma.vehicle.upsert({
    where: { plateNumber: 'XYZ-789' },
    update: { status: VehicleStatus.MAINTENANCE, organizationId: defaultOrg.id, categoryId: coasterCat.id },
    create: { plateNumber: 'XYZ-789', name: 'Demo Shuttle 2', model: 'Toyota Coaster', make: 'Toyota', year: 2020, capacity: 22, status: VehicleStatus.MAINTENANCE, categoryId: coasterCat.id, organizationId: defaultOrg.id },
  })
  await prisma.vehicle.upsert({
    where: { plateNumber: 'DEF-456' },
    update: { status: VehicleStatus.OUT_OF_SERVICE, organizationId: defaultOrg.id },
    create: { plateNumber: 'DEF-456', name: 'Outsourced Van', model: 'Mercedes Sprinter', type: 'OUTSOURCED', capacity: 16, status: VehicleStatus.OUT_OF_SERVICE, organizationId: defaultOrg.id },
  })
  console.log('✅ Vehicles ready')

  // Route and stops
  const route = await prisma.route.upsert({
    where: { id: 'route-downtown' },
    update: { vehicleId: vehicle.id, shiftId: morningShift.id, isActive: true, status: RouteStatus.ACTIVE, organizationId: defaultOrg.id },
    create: { id: 'route-downtown', name: 'Downtown Express', description: 'Main route covering downtown area', vehicleId: vehicle.id, shiftId: morningShift.id, date: new Date(), startTime: new Date('2025-01-01T08:00:00Z'), endTime: new Date('2025-01-01T16:00:00Z'), isActive: true, status: RouteStatus.ACTIVE, organizationId: defaultOrg.id },
  })
  await prisma.stop.upsert({
    where: { id: 'stop-central' },
    update: { routeId: route.id, organizationId: defaultOrg.id },
    create: { id: 'stop-central', name: 'Central Station', address: 'Downtown Central, Main St', latitude: 40.7589, longitude: -73.9851, order: 0, routeId: route.id, organizationId: defaultOrg.id },
  })
  await prisma.stop.upsert({
    where: { id: 'stop-biz' },
    update: { routeId: route.id, organizationId: defaultOrg.id },
    create: { id: 'stop-biz', name: 'Business District', address: 'Main Business Hub, Commerce Ave', latitude: 40.7614, longitude: -73.9776, order: 1, routeId: route.id, organizationId: defaultOrg.id },
  })
  console.log('✅ Route and stops ready')

  // Vehicle availability
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const startTime = new Date();
  startTime.setHours(8, 0, 0, 0);
  const endTime = new Date();
  endTime.setHours(18, 0, 0, 0);
  await prisma.vehicleAvailability.upsert({
    where: { vehicleId_shiftId_date: { vehicleId: vehicle.id, shiftId: morningShift.id, date: new Date(tomorrow.toDateString()) as any } },
    update: { startTime, endTime, available: true, driverId: driver.id, routeId: route.id, organizationId: defaultOrg.id },
    create: { date: tomorrow, startTime, endTime, available: true, vehicleId: vehicle.id, driverId: driver.id, routeId: route.id, shiftId: morningShift.id, organizationId: defaultOrg.id },
  })
  console.log('✅ Vehicle availability ready')

  // Vehicle requests
  await prisma.vehicleRequest.upsert({
    where: { id: 'vr-pending-1' },
    update: { status: ApprovalStatus.PENDING, organizationId: defaultOrg.id },
    create: { id: 'vr-pending-1', name: 'Additional Evening Shuttle', licensePlate: 'REQ-001', categoryId: standardCat.id, dailyRate: 250.0, capacity: 16, type: 'IN_HOUSE', model: 'Mercedes Sprinter', status: ApprovalStatus.PENDING, requestedBy: 'MANAGER', organizationId: defaultOrg.id },
  })
  await prisma.vehicleRequest.upsert({
    where: { id: 'vr-rejected-1' },
    update: { status: ApprovalStatus.REJECTED, organizationId: defaultOrg.id, comment: 'Budget constraints' },
    create: { id: 'vr-rejected-1', name: 'Weekend Microbus', licensePlate: 'REQ-002', categoryId: coasterCat.id, dailyRate: 300.0, capacity: 22, type: 'IN_HOUSE', model: 'Toyota Coaster', status: ApprovalStatus.REJECTED, requestedBy: 'MANAGER', approvedBy: 'ADMIN', approvedAt: new Date(), comment: 'Budget constraints', organizationId: defaultOrg.id },
  })
  console.log('✅ Vehicle requests ready')

  console.log('🎉 Database seeding completed successfully!')

  const orgData = await prisma.organization.findUnique({
    where: { id: defaultOrg.id },
    include: {
      members: { include: { user: true } },
      drivers: true,
      vehicles: true,
      vehicleCategories: true,
      routes: { include: { stops: true } },
      departments: true,
      shifts: true,
      employees: true,
      vehicleAvailability: true,
      vehicleRequests: true
    },
  })
  console.log('📊 Organization data verification:')
  console.log(`   - Members: ${orgData?.members.length}`)
  console.log(`   - Drivers: ${orgData?.drivers.length}`)
  console.log(`   - Vehicles: ${orgData?.vehicles.length}`)
  console.log(`   - Vehicle Categories: ${orgData?.vehicleCategories.length}`)
  console.log(`   - Routes: ${orgData?.routes.length}`)
  console.log(`   - Departments: ${orgData?.departments.length}`)
  console.log(`   - Shifts: ${orgData?.shifts.length}`)
  console.log(`   - Employees: ${orgData?.employees.length}`)
  console.log(`   - Vehicle Availability Records: ${orgData?.vehicleAvailability.length}`)
  console.log(`   - Vehicle Requests: ${orgData?.vehicleRequests.length}`)
  console.log(`   - Total Stops: ${orgData?.routes.reduce((sum, r) => sum + r.stops.length, 0)}`)
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:')
    console.error(e)
    throw e
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
