import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seeding...')

  // Create initial tenant
  const tenant = await prisma.tenant.create({
    data: {
      name: 'Demo Fleet Company',
    },
  })

  console.log('✅ Created tenant:', tenant.name)

  // Create initial admin user for the tenant
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@demofleet.com',
      password: 'hashed_password_here', // In production, this should be properly hashed
      name: 'Admin User',
      role: 'ADMIN',
      tenantId: tenant.id,
    },
  })

  console.log('✅ Created admin user:', adminUser.email)

  // Create a sample department
  const department = await prisma.department.create({
    data: {
      name: 'Operations',
      tenantId: tenant.id,
    },
  })

  console.log('✅ Created department:', department.name)

  // Create a sample shift
  const morningShift = await prisma.shift.create({
    data: {
      name: 'Morning Shift',
      startTime: new Date('2025-01-01T08:00:00Z'),
      endTime: new Date('2025-01-01T16:00:00Z'),
      timeZone: 'UTC',
      tenantId: tenant.id,
    },
  })

  console.log('✅ Created shift:', morningShift.name)

  // Create a sample employee
  const employee = await prisma.employee.create({
    data: {
      name: 'John Employee',
      location: 'Main Office',
      departmentId: department.id,
      shiftId: morningShift.id,
      tenantId: tenant.id,
    },
  })

  console.log('✅ Created employee:', employee.name)

  // Create a sample driver
  const driver = await prisma.driver.create({
    data: {
      name: 'John Driver',
      email: 'driver@demofleet.com',
      phone: '+1-555-0124',
      licenseNumber: 'DL123456789',
      experienceYears: 5,
      isActive: true,
      tenantId: tenant.id,
    },
  })

  console.log('✅ Created driver:', driver.licenseNumber)

  // Create a vehicle category
  const vehicleCategory = await prisma.vehicleCategory.create({
    data: {
      name: 'Standard Shuttle',
      capacity: 14,
      tenantId: tenant.id,
    },
  })

  console.log('✅ Created vehicle category:', vehicleCategory.name)

  // Create a sample vehicle
  const vehicle = await prisma.vehicle.create({
    data: {
      plateNumber: 'ABC-123',
      name: 'Demo Shuttle 1',
      model: 'Toyota Hiace',
      make: 'Toyota',
      year: 2022,
      capacity: 14,
      status: 'AVAILABLE',
      categoryId: vehicleCategory.id,
      driverId: driver.id,
      tenantId: tenant.id,
    },
  })

  console.log('✅ Created vehicle:', vehicle.plateNumber)

  // Create a sample route
  const route = await prisma.route.create({
    data: {
      name: 'Downtown Express',
      description: 'Main route covering downtown area',
      vehicleId: vehicle.id,
      shiftId: morningShift.id,
      date: new Date(),
      startTime: new Date('2025-01-01T08:00:00Z'),
      endTime: new Date('2025-01-01T16:00:00Z'),
      isActive: true,
      tenantId: tenant.id,
    },
  })

  console.log('✅ Created route:', route.name)

  // Create sample stops for the route
  const stop1 = await prisma.stop.create({
    data: {
      name: 'Central Station',
      address: 'Downtown Central, Main St',
      latitude: 40.7589,
      longitude: -73.9851,
      order: 0,
      routeId: route.id,
      tenantId: tenant.id,
    },
  })

  const stop2 = await prisma.stop.create({
    data: {
      name: 'Business District',
      address: 'Main Business Hub, Commerce Ave',
      latitude: 40.7614,
      longitude: -73.9776,
      order: 1,
      routeId: route.id,
      tenantId: tenant.id,
    },
  })

  console.log('✅ Created stops:', stop1.name, 'and', stop2.name)

  // Create vehicle availability (requires date and proper DateTime fields)
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  
  const startTime = new Date()
  startTime.setHours(8, 0, 0, 0)
  
  const endTime = new Date()
  endTime.setHours(18, 0, 0, 0)

  const availability = await prisma.vehicleAvailability.create({
    data: {
      date: tomorrow,
      startTime: startTime,
      endTime: endTime,
      vehicleId: vehicle.id,
      driverId: driver.id,
      routeId: route.id,
      shiftId: morningShift.id,
      tenantId: tenant.id,
    },
  })

  console.log('✅ Created vehicle availability for tomorrow')

  // Create a sample vehicle request
  const vehicleRequest = await prisma.vehicleRequest.create({
    data: {
      name: 'Additional Evening Shuttle',
      licensePlate: 'DEF-456',
      categoryId: vehicleCategory.id,
      dailyRate: 250.00,
      capacity: 16,
      type: 'in-house',
      model: 'Mercedes Sprinter',
      status: 'PENDING',
      requestedBy: 'MANAGER',
      tenantId: tenant.id,
    },
  })

  console.log('✅ Created vehicle request:', vehicleRequest.name)

  console.log('🎉 Database seeding completed successfully!')
  
  // Verify multi-tenant isolation
  const tenantData = await prisma.tenant.findUnique({
    where: { id: tenant.id },
    include: {
      users: true,
      drivers: true,
      vehicles: {
        include: {
          category: true,
        },
      },
      routes: {
        include: {
          stops: true,
        },
      },
      departments: true,
      shifts: true,
      employees: true,
      vehicleCategories: true,
      vehicleAvailability: true,
      vehicleRequests: true,
    },
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
  console.log(`   - Total Stops: ${tenantData?.routes.reduce((sum, route) => sum + route.stops.length, 0)}`)
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
