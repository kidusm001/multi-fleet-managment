import { PrismaClient, ApprovalStatus, VehicleStatus, RouteStatus } from '@prisma/client'

const prisma = new PrismaClient()

async function upsertDefaultTenant() {
  const tenant = await prisma.tenant.upsert({
    where: { id: 'default-tenant' },
    update: { name: 'Default Tenant' },
    create: { id: 'default-tenant', name: 'Default Tenant' },
  });
  return tenant;
}

async function main() {
  console.log('🌱 Starting database seeding...')

  // Tenants
  const tenant = await upsertDefaultTenant();
  const acme = await prisma.tenant.upsert({
    where: { id: 'acme-tenant' },
    update: { name: 'ACME Logistics' },
    create: { id: 'acme-tenant', name: 'ACME Logistics' },
  });
  console.log('✅ Tenants ready:', tenant.name, 'and', acme.name)

  // Users
  await prisma.user.upsert({
    where: { email: 'admin@demofleet.com' },
    update: { role: 'ADMIN', tenantId: tenant.id },
    create: { email: 'admin@demofleet.com', password: 'hashed_password_here', name: 'Admin User', role: 'ADMIN', tenantId: tenant.id },
  });
  await prisma.user.upsert({
    where: { email: 'manager@acme.com' },
    update: { role: 'MANAGER', tenantId: acme.id },
    create: { email: 'manager@acme.com', password: 'hashed_password_here', name: 'ACME Manager', role: 'MANAGER', tenantId: acme.id },
  });
  console.log('✅ Users ready')

  // Departments
  const department = await prisma.department.upsert({
    where: { id: 'dept-default-ops' },
    update: { name: 'Operations', tenantId: tenant.id },
    create: { id: 'dept-default-ops', name: 'Operations', tenantId: tenant.id },
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
      tenantId: tenant.id,
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
      tenantId: tenant.id,
    },
  })
  console.log('✅ Shifts ready')

  // Employees
  await prisma.employee.upsert({
    where: { id: 'emp-john' },
    update: { departmentId: department.id, shiftId: morningShift.id, tenantId: tenant.id },
    create: { id: 'emp-john', name: 'John Employee', location: 'Main Office', departmentId: department.id, shiftId: morningShift.id, tenantId: tenant.id },
  })

  // Drivers
  const driver = await prisma.driver.upsert({
    where: { licenseNumber: 'DL123456789' },
    update: { name: 'John Driver', tenantId: tenant.id, isActive: true },
    create: { name: 'John Driver', email: 'driver@demofleet.com', phone: '+1-555-0124', licenseNumber: 'DL123456789', experienceYears: 5, isActive: true, tenantId: tenant.id },
  })
  const driver2 = await prisma.driver.upsert({
    where: { licenseNumber: 'DL987654321' },
    update: { name: 'Jane Driver', tenantId: tenant.id, isActive: true },
    create: { name: 'Jane Driver', email: 'jane@demofleet.com', phone: '+1-555-0456', licenseNumber: 'DL987654321', experienceYears: 3, isActive: true, tenantId: tenant.id },
  })
  console.log('✅ Drivers ready')

  // Vehicle categories
  const standardCat = await prisma.vehicleCategory.upsert({
    where: { id: 'cat-standard' },
    update: { name: 'Standard Shuttle', capacity: 14, tenantId: tenant.id },
    create: { id: 'cat-standard', name: 'Standard Shuttle', capacity: 14, tenantId: tenant.id },
  })
  const coasterCat = await prisma.vehicleCategory.upsert({
    where: { id: 'cat-coaster' },
    update: { name: 'Toyota Coaster', capacity: 22, tenantId: tenant.id },
    create: { id: 'cat-coaster', name: 'Toyota Coaster', capacity: 22, tenantId: tenant.id },
  })
  console.log('✅ Vehicle categories ready')

  // Vehicles
  const vehicle = await prisma.vehicle.upsert({
    where: { plateNumber: 'ABC-123' },
    update: { name: 'Demo Shuttle 1', status: VehicleStatus.AVAILABLE, driverId: driver.id, categoryId: standardCat.id, tenantId: tenant.id },
    create: { plateNumber: 'ABC-123', name: 'Demo Shuttle 1', model: 'Toyota Hiace', make: 'Toyota', year: 2022, capacity: 14, status: VehicleStatus.AVAILABLE, categoryId: standardCat.id, driverId: driver.id, tenantId: tenant.id },
  })
  await prisma.vehicle.upsert({
    where: { plateNumber: 'XYZ-789' },
    update: { status: VehicleStatus.MAINTENANCE, tenantId: tenant.id, categoryId: coasterCat.id },
    create: { plateNumber: 'XYZ-789', name: 'Demo Shuttle 2', model: 'Toyota Coaster', make: 'Toyota', year: 2020, capacity: 22, status: VehicleStatus.MAINTENANCE, categoryId: coasterCat.id, tenantId: tenant.id },
  })
  await prisma.vehicle.upsert({
    where: { plateNumber: 'DEF-456' },
    update: { status: VehicleStatus.OUT_OF_SERVICE, tenantId: tenant.id },
    create: { plateNumber: 'DEF-456', name: 'Outsourced Van', model: 'Mercedes Sprinter', type: 'outsourced', capacity: 16, status: VehicleStatus.OUT_OF_SERVICE, tenantId: tenant.id },
  })
  console.log('✅ Vehicles ready')

  // Route and stops
  const route = await prisma.route.upsert({
    where: { id: 'route-downtown' },
    update: { vehicleId: vehicle.id, shiftId: morningShift.id, isActive: true, status: RouteStatus.ACTIVE, tenantId: tenant.id },
    create: { id: 'route-downtown', name: 'Downtown Express', description: 'Main route covering downtown area', vehicleId: vehicle.id, shiftId: morningShift.id, date: new Date(), startTime: new Date('2025-01-01T08:00:00Z'), endTime: new Date('2025-01-01T16:00:00Z'), isActive: true, status: RouteStatus.ACTIVE, tenantId: tenant.id },
  })
  await prisma.stop.upsert({
    where: { id: 'stop-central' },
    update: { routeId: route.id, tenantId: tenant.id },
    create: { id: 'stop-central', name: 'Central Station', address: 'Downtown Central, Main St', latitude: 40.7589, longitude: -73.9851, order: 0, routeId: route.id, tenantId: tenant.id },
  })
  await prisma.stop.upsert({
    where: { id: 'stop-biz' },
    update: { routeId: route.id, tenantId: tenant.id },
    create: { id: 'stop-biz', name: 'Business District', address: 'Main Business Hub, Commerce Ave', latitude: 40.7614, longitude: -73.9776, order: 1, routeId: route.id, tenantId: tenant.id },
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
    update: { startTime, endTime, available: true, driverId: driver.id, routeId: route.id, tenantId: tenant.id },
    create: { date: tomorrow, startTime, endTime, available: true, vehicleId: vehicle.id, driverId: driver.id, routeId: route.id, shiftId: morningShift.id, tenantId: tenant.id },
  })
  console.log('✅ Vehicle availability ready')

  // Vehicle requests
  await prisma.vehicleRequest.upsert({
    where: { id: 'vr-pending-1' },
    update: { status: ApprovalStatus.PENDING, tenantId: tenant.id },
    create: { id: 'vr-pending-1', name: 'Additional Evening Shuttle', licensePlate: 'REQ-001', categoryId: standardCat.id, dailyRate: 250.0, capacity: 16, type: 'in-house', model: 'Mercedes Sprinter', status: ApprovalStatus.PENDING, requestedBy: 'MANAGER', tenantId: tenant.id },
  })
  await prisma.vehicleRequest.upsert({
    where: { id: 'vr-rejected-1' },
    update: { status: ApprovalStatus.REJECTED, tenantId: tenant.id, comment: 'Budget constraints' },
    create: { id: 'vr-rejected-1', name: 'Weekend Microbus', licensePlate: 'REQ-002', categoryId: coasterCat.id, dailyRate: 300.0, capacity: 22, type: 'in-house', model: 'Toyota Coaster', status: ApprovalStatus.REJECTED, requestedBy: 'MANAGER', approvedBy: 'ADMIN', approvedAt: new Date(), comment: 'Budget constraints', tenantId: tenant.id },
  })
  console.log('✅ Vehicle requests ready')

  console.log('🎉 Database seeding completed successfully!')

  // Quick verification
  const tenantData = await prisma.tenant.findUnique({
    where: { id: tenant.id },
    include: { users: true, drivers: true, vehicles: true, vehicleCategories: true, routes: { include: { stops: true } }, departments: true, shifts: true, employees: true, vehicleAvailability: true, vehicleRequests: true },
  })
  console.log('📊 Tenant data verification:')
  console.log(`   - Users: ${tenantData?.users.length}`)
  console.log(`   - Drivers: ${tenantData?.drivers.length}`)
  console.log(`   - Vehicles: ${tenantData?.vehicles.length}`)
  console.log(`   - Vehicle Categories: ${tenantData?.vehicleCategories.length}`)
  console.log(`   - Routes: ${tenantData?.routes.length}`)
  console.log(`   - Departments: ${tenantData?.departments.length}`)
  console.log(`   - Shifts: ${tenantData?.shifts.length}`)
  console.log(`   - Employees: ${tenantData?.employees.length}`)
  console.log(`   - Vehicle Availability Records: ${tenantData?.vehicleAvailability.length}`)
  console.log(`   - Vehicle Requests: ${tenantData?.vehicleRequests.length}`)
  console.log(`   - Total Stops: ${tenantData?.routes.reduce((sum, r) => sum + r.stops.length, 0)}`)
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
