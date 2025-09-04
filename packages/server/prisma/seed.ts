import { PrismaClient, ApprovalStatus, VehicleStatus, RouteStatus, NotificationType, NotificationStatus, DriverStatus, PaymentStatus } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * Enhanced Fleet Management Seed Script
 * 
 * This seed script uses the ACTUAL organizations and members created through
 * the setupOrganizationsWithAuth.ts script to create comprehensive, realistic
 * fleet management data for all organizations.
 * 
 * Prerequisites:
 * 1. Run: npx tsx src/script/createUsers.ts (creates users via Better Auth)
 * 2. Run: npx tsx src/script/setupOrganizationsWithAuth.ts (creates orgs with members)
 * 3. Then run this seed script: npx tsx prisma/seed.ts
 * 
 * The script creates realistic data for:
 * - Multiple fleet organizations with proper member relationships
 * - Organization-specific departments, shifts, and employees
 * - Vehicle fleets with different categories and statuses
 * - Realistic routes with multiple stops for each organization
 * - Driver assignments and availability schedules
 * - Vehicle requests and approval workflows
 * - Payroll reports and notifications
 * - Fleet analytics and reporting data
 */

// Helper function to generate consistent IDs for seed data
function generateSeedId(prefix: string, suffix: string): string {
  return `${prefix}-${suffix}`
}

// Helper function to get current date with time set to start of day
function getToday(): Date {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return today
}

// Helper function to get tomorrow's date
function getTomorrow(): Date {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  tomorrow.setHours(0, 0, 0, 0)
  return tomorrow
}

// Get date for next week
function getNextWeek(): Date {
  const nextWeek = new Date()
  nextWeek.setDate(nextWeek.getDate() + 7)
  nextWeek.setHours(0, 0, 0, 0)
  return nextWeek
}

// Random selection helper
function getRandomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)]
}

async function getExistingOrganizations() {
  console.log('🏢 Fetching existing organizations from Better Auth...')
  
  const organizations = await prisma.organization.findMany({
    include: {
      members: {
        include: {
          user: true
        }
      }
    },
    orderBy: {
      createdAt: 'asc'
    }
  })

  if (organizations.length === 0) {
    throw new Error(`❌ No organizations found! 
Please create organizations first:
1. Run: npx tsx src/script/createUsers.ts
2. Run: npx tsx src/script/setupOrganizationsWithAuth.ts
3. Then run this seed script`)
  }

  console.log(`✅ Found ${organizations.length} organization(s) to seed`)
  organizations.forEach((org, index) => {
    console.log(`   ${index + 1}. ${org.name} (${org.slug}) - ${org.members.length} members`)
  })
  
  return organizations
}

async function getUsersByRole(organizationId: string) {
  const members = await prisma.member.findMany({
    where: { organizationId },
    include: { user: true },
    orderBy: [{ role: 'asc' }, { createdAt: 'asc' }]
  })

  const usersByRole = {
    owners: members.filter(m => m.role === 'owner'),
    admins: members.filter(m => m.role === 'admin'), 
    managers: members.filter(m => m.role === 'manager'),
    drivers: members.filter(m => m.role === 'driver'),
    employees: members.filter(m => m.role === 'employee'),
  }

  return { members, usersByRole }
}

async function createDepartmentsAndShifts(org: any) {
  console.log(`   📂 Creating departments and shifts for ${org.name}...`)

  // Create departments specific to fleet management
  const departments = [
    { id: generateSeedId('dept', `ops-${org.id}`), name: 'Fleet Operations', orgId: org.id },
    { id: generateSeedId('dept', `maint-${org.id}`), name: 'Vehicle Maintenance', orgId: org.id },
    { id: generateSeedId('dept', `admin-${org.id}`), name: 'Administration', orgId: org.id },
  ]

  const createdDepartments: any[] = []
  for (const dept of departments) {
    const department = await prisma.department.upsert({
      where: { id: dept.id },
      update: { name: dept.name, organizationId: dept.orgId },
      create: { 
        id: dept.id, 
        name: dept.name, 
        organizationId: dept.orgId 
      },
    })
    createdDepartments.push(department)
  }

  // Create realistic shifts for fleet operations
  const now = new Date()
  const shifts = [
    {
      id: generateSeedId('shift', `morning-${org.id}`),
      name: 'Morning Shift',
      startHour: 6,
      endHour: 14
    },
    {
      id: generateSeedId('shift', `afternoon-${org.id}`),
      name: 'Afternoon Shift', 
      startHour: 14,
      endHour: 22
    },
    {
      id: generateSeedId('shift', `night-${org.id}`),
      name: 'Night Shift',
      startHour: 22,
      endHour: 6
    }
  ]

  const createdShifts: any[] = []
  for (const shiftData of shifts) {
    const startTime = new Date(now)
    startTime.setHours(shiftData.startHour, 0, 0, 0)
    const endTime = new Date(now)
    endTime.setHours(shiftData.endHour, 0, 0, 0)

    const shift = await prisma.shift.upsert({
      where: { id: shiftData.id },
      update: {},
      create: {
        id: shiftData.id,
        name: shiftData.name,
        startTime: startTime,
        endTime: endTime,
        timeZone: 'UTC',
        organizationId: org.id,
      },
    })
    createdShifts.push(shift)
  }

  console.log(`   ✅ Created ${createdDepartments.length} departments and ${createdShifts.length} shifts`)
  return { departments: createdDepartments, shifts: createdShifts }
}
async function createEmployeesFromMembers(org: any, departments: any[], shifts: any[], usersByRole: any) {
  console.log(`   👥 Creating employee records for ${org.name}...`)

  const employeeRoles = ['admin', 'manager', 'employee']
  const eligibleMembers = Object.values(usersByRole).flat().filter((member: any) => 
    employeeRoles.includes(member.role)
  ) as any[]

  let createdEmployees = 0
  for (const member of eligibleMembers) {
    const department = getRandomElement(departments)
    const shift = getRandomElement(shifts)

    try {
      await prisma.employee.upsert({
        where: { id: generateSeedId('emp', `${member.user.id}-${org.id}`) },
        update: { 
          name: member.user.name,
          departmentId: department.id, 
          shiftId: shift.id, 
          organizationId: org.id, 
          userId: member.user.id 
        },
        create: { 
          id: generateSeedId('emp', `${member.user.id}-${org.id}`),
          name: member.user.name, 
          location: member.role === 'admin' ? 'Head Office' : 
                   member.role === 'manager' ? 'Operations Center' : 'Field Office', 
          departmentId: department.id, 
          shiftId: shift.id, 
          organizationId: org.id, 
          userId: member.user.id 
        },
      })
      createdEmployees++
    } catch (error) {
      console.log(`     ⚠️  Could not create employee record for ${member.user.name}: ${error}`)
    }
  }
  
  console.log(`   ✅ Created ${createdEmployees} employee records`)
  return createdEmployees
}

async function createDriversFromMembers(org: any, usersByRole: any) {
  console.log(`   🚗 Creating driver records for ${org.name}...`)

  const driverMembers = usersByRole.drivers || []
  const createdDrivers: any[] = []
  
  if (driverMembers.length > 0) {
    for (let i = 0; i < driverMembers.length; i++) {
      const member = driverMembers[i]
      const timestamp = Date.now()
      const licenseNumber = `DL${org.id.slice(-4)}${timestamp.toString().slice(-4)}${i.toString().padStart(2, '0')}`
      const uniqueDriverId = generateSeedId('driver', `${member.user.id}-${org.id}-${i}`)
      
      try {
        // Check if driver already exists for this user in this organization
        const existingDriver = await prisma.driver.findFirst({
          where: {
            email: member.user.email,
            organizationId: org.id
          }
        })

        if (existingDriver) {
          console.log(`     ⚠️  Driver already exists for ${member.user.name} in ${org.name}`)
          createdDrivers.push(existingDriver)
          continue
        }

        const driver = await prisma.driver.create({
          data: { 
            id: uniqueDriverId,
            name: member.user.name, 
            email: null, // Remove email to avoid conflicts across organizations
            phoneNumber: `+1-555-${String(Math.floor(Math.random() * 9000) + 1000)}-${i}`, 
            licenseNumber, 
            experienceYears: Math.floor(Math.random() * 10) + 2, 
            status: DriverStatus.ACTIVE, 
            organizationId: org.id 
          },
        })
        createdDrivers.push(driver)
      } catch (error) {
        console.log(`     ⚠️  Could not create driver record for ${member.user.name}: ${error}`)
      }
    }
  }
  
  console.log(`   ✅ Created ${createdDrivers.length} driver records`)
  return createdDrivers
}

async function createVehicleCategories(org: any) {
  console.log(`   🚐 Creating vehicle categories for ${org.name}...`)

  const categories = [
    { name: 'Standard Shuttle', capacity: 14 },
    { name: 'Mini Bus', capacity: 22 },
    { name: 'Large Coach', capacity: 45 },
    { name: 'Van', capacity: 8 },
  ]

  const createdCategories: any[] = []
  for (let i = 0; i < categories.length; i++) {
    const cat = categories[i]
    const category = await prisma.vehicleCategory.upsert({
      where: { id: generateSeedId('cat', `${cat.name.toLowerCase().replace(' ', '-')}-${org.id}`) },
      update: { 
        name: cat.name, 
        capacity: cat.capacity, 
        organizationId: org.id 
      },
      create: { 
        id: generateSeedId('cat', `${cat.name.toLowerCase().replace(' ', '-')}-${org.id}`),
        name: cat.name, 
        capacity: cat.capacity, 
        organizationId: org.id 
      },
    })
    createdCategories.push(category)
  }
  
  console.log(`   ✅ Created ${createdCategories.length} vehicle categories`)
  return createdCategories
}

async function createVehiclesForOrg(org: any, categories: any[], drivers: any[]) {
  console.log(`   🚗 Creating vehicles for ${org.name}...`)

  const vehicleTemplates = [
    { name: 'Fleet Shuttle 1', plateNumber: 'ABC-001', model: 'Toyota Hiace', make: 'Toyota', year: 2022, status: VehicleStatus.AVAILABLE },
    { name: 'Fleet Shuttle 2', plateNumber: 'ABC-002', model: 'Ford Transit', make: 'Ford', year: 2021, status: VehicleStatus.AVAILABLE },
    { name: 'Maintenance Van', plateNumber: 'MNT-001', model: 'Mercedes Sprinter', make: 'Mercedes', year: 2020, status: VehicleStatus.MAINTENANCE },
    { name: 'Backup Coach', plateNumber: 'BCK-001', model: 'Toyota Coaster', make: 'Toyota', year: 2019, status: VehicleStatus.INACTIVE },
  ]

  const createdVehicles: any[] = []
  for (let i = 0; i < vehicleTemplates.length; i++) {
    const template = vehicleTemplates[i]
    const category = getRandomElement(categories)
    const driver = template.status === VehicleStatus.AVAILABLE && drivers.length > 0 ? 
      getRandomElement(drivers) : null

    // Make plate numbers unique per organization
    const uniquePlateNumber = `${template.plateNumber}-${org.slug.toUpperCase()}`

    try {
      const vehicle = await prisma.vehicle.upsert({
        where: { plateNumber: uniquePlateNumber },
        update: { 
          name: template.name, 
          status: template.status, 
          driverId: driver?.id, 
          categoryId: category.id, 
          organizationId: org.id 
        },
        create: { 
          id: generateSeedId('vehicle', `${org.id}-${i}`),
          plateNumber: uniquePlateNumber, 
          name: template.name, 
          model: template.model, 
          make: template.make, 
          year: template.year, 
          capacity: category.capacity, 
          status: template.status, 
          categoryId: category.id, 
          driverId: driver?.id, 
          organizationId: org.id 
        },
      })
      createdVehicles.push(vehicle)
    } catch (error) {
      console.log(`     ⚠️  Could not create vehicle ${template.name}: ${error}`)
    }
  }
  
  console.log(`   ✅ Created ${createdVehicles.length} vehicles`)
  return createdVehicles
}

async function createRoutesAndStops(org: any, vehicles: any[], shifts: any[]) {
  console.log(`   🗺️  Creating routes and stops for ${org.name}...`)

  // Realistic route data for different organization types
  const routeTemplates = [
    {
      name: 'Downtown Express',
      description: 'Main downtown business route',
      stops: [
        { name: 'Central Station', address: 'Downtown Central, Main St', lat: 40.7589, lng: -73.9851 },
        { name: 'Business District', address: 'Business Hub, Commerce Ave', lat: 40.7614, lng: -73.9776 },
        { name: 'Shopping Center', address: 'City Mall, Retail Blvd', lat: 40.7505, lng: -73.9934 },
      ]
    },
    {
      name: 'Airport Shuttle',
      description: 'Direct airport connection service',
      stops: [
        { name: 'Airport Terminal', address: 'International Airport, Terminal 1', lat: 40.6892, lng: -74.1745 },
        { name: 'Hotel District', address: 'Grand Plaza Hotel Area', lat: 40.7549, lng: -73.9840 },
        { name: 'Convention Center', address: 'Metro Convention Center', lat: 40.7505, lng: -73.9934 },
      ]
    }
  ]

  const createdRoutes: any[] = []
  for (let i = 0; i < routeTemplates.length && i < vehicles.length; i++) {
    const template = routeTemplates[i]
    const vehicle = vehicles[i]
    const shift = getRandomElement(shifts)
    
    const today = getToday()
    const routeStartTime = new Date(today)
    routeStartTime.setHours(8 + i * 2, 0, 0, 0)
    const routeEndTime = new Date(today)
    routeEndTime.setHours(16 + i * 2, 0, 0, 0)

    try {
      const route = await prisma.route.upsert({
        where: { id: generateSeedId('route', `${org.id}-${i}`) },
        update: { 
          vehicleId: vehicle.id, 
          shiftId: shift.id, 
          isActive: true, 
          status: RouteStatus.ACTIVE, 
          organizationId: org.id 
        },
        create: { 
          id: generateSeedId('route', `${org.id}-${i}`),
          name: template.name, 
          description: template.description, 
          vehicleId: vehicle.id, 
          shiftId: shift.id, 
          date: today, 
          startTime: routeStartTime, 
          endTime: routeEndTime, 
          isActive: true, 
          status: RouteStatus.ACTIVE, 
          organizationId: org.id 
        },
      })

      // Create stops for this route
      for (let j = 0; j < template.stops.length; j++) {
        const stopData = template.stops[j]
        await prisma.stop.upsert({
          where: { id: generateSeedId('stop', `${org.id}-${i}-${j}`) },
          update: { 
            routeId: route.id, 
            organizationId: org.id 
          },
          create: { 
            id: generateSeedId('stop', `${org.id}-${i}-${j}`),
            name: stopData.name, 
            address: stopData.address, 
            latitude: stopData.lat, 
            longitude: stopData.lng, 
            order: j, 
            routeId: route.id, 
            organizationId: org.id 
          },
        })
      }

      createdRoutes.push(route)
    } catch (error) {
      console.log(`     ⚠️  Could not create route ${template.name}: ${error}`)
    }
  }
  
  console.log(`   ✅ Created ${createdRoutes.length} routes with stops`)
  return createdRoutes
}

async function createVehicleAvailability(org: any, vehicles: any[], drivers: any[], routes: any[], shifts: any[]) {
  console.log(`   📅 Creating vehicle availability for ${org.name}...`)

  const tomorrow = getTomorrow()
  const nextWeek = getNextWeek()
  let availabilityCount = 0

  // Only create availability for vehicles that have drivers available
  for (const vehicle of vehicles.slice(0, 2)) { // Limit to 2 vehicles for seed data
    if (vehicle.status === VehicleStatus.AVAILABLE && drivers.length > 0) {
      const driver = drivers.find(d => d.id === vehicle.driverId) || getRandomElement(drivers)
      const route = getRandomElement(routes)
      const shift = getRandomElement(shifts)

      // Create availability for tomorrow
      try {
        const startTime = new Date(tomorrow)
        startTime.setHours(8, 0, 0, 0)
        const endTime = new Date(tomorrow)
        endTime.setHours(18, 0, 0, 0)

        await prisma.vehicleAvailability.upsert({
          where: { 
            vehicleId_shiftId_date: { 
              vehicleId: vehicle.id, 
              shiftId: shift.id, 
              date: tomorrow 
            } 
          },
          update: { 
            startTime, 
            endTime, 
            available: true, 
            driverId: driver.id, 
            routeId: route?.id, 
            organizationId: org.id 
          },
          create: { 
            id: generateSeedId('availability', `${org.id}-${vehicle.id}-${shift.id}-${tomorrow.getTime()}`),
            date: tomorrow, 
            startTime, 
            endTime, 
            available: true, 
            vehicleId: vehicle.id, 
            driverId: driver.id, 
            routeId: route?.id, 
            shiftId: shift.id, 
            organizationId: org.id 
          },
        })
        availabilityCount++

        // Create availability for next week
        const nextWeekStart = new Date(nextWeek)
        nextWeekStart.setHours(8, 0, 0, 0)
        const nextWeekEnd = new Date(nextWeek)
        nextWeekEnd.setHours(18, 0, 0, 0)

        await prisma.vehicleAvailability.upsert({
          where: { 
            vehicleId_shiftId_date: { 
              vehicleId: vehicle.id, 
              shiftId: shift.id, 
              date: nextWeek 
            } 
          },
          update: { 
            startTime: nextWeekStart, 
            endTime: nextWeekEnd, 
            available: true, 
            driverId: driver.id, 
            routeId: route?.id, 
            organizationId: org.id 
          },
          create: { 
            id: generateSeedId('availability', `${org.id}-${vehicle.id}-${shift.id}-${nextWeek.getTime()}`),
            date: nextWeek, 
            startTime: nextWeekStart, 
            endTime: nextWeekEnd, 
            available: true, 
            vehicleId: vehicle.id, 
            driverId: driver.id, 
            routeId: route?.id, 
            shiftId: shift.id, 
            organizationId: org.id 
          },
        })
        availabilityCount++
      } catch (error) {
        console.log(`     ⚠️  Could not create availability for vehicle ${vehicle.name}: ${error}`)
      }
    } else if (drivers.length === 0) {
      console.log(`     ⚠️  Skipping availability for ${vehicle.name} - no drivers available`)
    }
  }
  
  console.log(`   ✅ Created ${availabilityCount} availability records`)
  return availabilityCount
}

async function createVehicleRequests(org: any, categories: any[], usersByRole: any) {
  console.log(`   📋 Creating vehicle requests for ${org.name}...`)

  const requestTemplates = [
    {
      name: 'Additional Evening Shuttle',
      licensePlate: `REQ-001-${org.slug.toUpperCase()}`,
      dailyRate: 250.0,
      capacity: 16,
      type: 'IN_HOUSE',
      model: 'Mercedes Sprinter',
      status: ApprovalStatus.PENDING,
      requestedBy: 'MANAGER'
    },
    {
      name: 'Weekend Service Van',
      licensePlate: `REQ-002-${org.slug.toUpperCase()}`,
      dailyRate: 180.0,
      capacity: 8,
      type: 'IN_HOUSE',
      model: 'Ford Transit',
      status: ApprovalStatus.APPROVED,
      requestedBy: 'MANAGER',
      comment: 'Approved for weekend operations'
    },
    {
      name: 'Luxury Coach Upgrade',
      licensePlate: `REQ-003-${org.slug.toUpperCase()}`,
      dailyRate: 450.0,
      capacity: 45,
      type: 'OUTSOURCED',
      model: 'Volvo 9700',
      status: ApprovalStatus.REJECTED,
      requestedBy: 'ADMIN',
      comment: 'Budget constraints for current quarter'
    }
  ]

  let requestCount = 0
  for (let i = 0; i < requestTemplates.length; i++) {
    const template = requestTemplates[i]
    const category = getRandomElement(categories)

    try {
      await prisma.vehicleRequest.upsert({
        where: { id: generateSeedId('vr', `${org.id}-${i}`) },
        update: { 
          status: template.status as ApprovalStatus, 
          organizationId: org.id,
          comment: template.comment 
        },
        create: { 
          id: generateSeedId('vr', `${org.id}-${i}`),
          name: template.name, 
          licensePlate: template.licensePlate, 
          categoryId: category.id, 
          dailyRate: template.dailyRate, 
          capacity: template.capacity, 
          type: template.type, 
          model: template.model, 
          status: template.status as ApprovalStatus, 
          requestedBy: template.requestedBy, 
          approvedBy: template.status === ApprovalStatus.APPROVED ? 'ADMIN' : 
                     template.status === ApprovalStatus.REJECTED ? 'ADMIN' : undefined,
          approvedAt: template.status !== ApprovalStatus.PENDING ? new Date() : undefined,
          comment: template.comment, 
          organizationId: org.id 
        },
      })
      requestCount++
    } catch (error) {
      console.log(`     ⚠️  Could not create vehicle request ${template.name}: ${error}`)
    }
  }
  
  console.log(`   ✅ Created ${requestCount} vehicle requests`)
  return requestCount
}

async function createNotifications(org: any, usersByRole: any) {
  console.log(`   🔔 Creating notifications for ${org.name}...`)

  const notificationTemplates = [
    {
      title: 'Vehicle Maintenance Due',
      message: 'Fleet Shuttle 1 is due for scheduled maintenance next week.',
      type: NotificationType.WARNING,
      status: NotificationStatus.UNREAD,
      recipientRole: 'manager'
    },
    {
      title: 'New Route Assignment',
      message: 'Downtown Express route has been assigned to your vehicle.',
      type: NotificationType.INFO,
      status: NotificationStatus.READ,
      recipientRole: 'driver'
    },
    {
      title: 'System Maintenance',
      message: 'Scheduled system maintenance will occur this weekend.',
      type: NotificationType.SYSTEM,
      status: NotificationStatus.UNREAD,
      recipientRole: 'admin'
    }
  ]

  let notificationCount = 0
  for (let i = 0; i < notificationTemplates.length; i++) {
    const template = notificationTemplates[i]
    const recipients = usersByRole[template.recipientRole + 's'] || []

    for (const recipient of recipients.slice(0, 2)) { // Limit to 2 recipients per role
      try {
        await prisma.notification.upsert({
          where: { id: generateSeedId('notif', `${org.id}-${i}-${recipient.user.id}`) },
          update: { 
            organizationId: org.id 
          },
          create: { 
            id: generateSeedId('notif', `${org.id}-${i}-${recipient.user.id}`),
            title: template.title, 
            message: template.message, 
            type: template.type, 
            status: template.status, 
            userId: recipient.user.id, 
            organizationId: org.id 
          },
        })
        notificationCount++
      } catch (error) {
        console.log(`     ⚠️  Could not create notification for ${recipient.user.name}: ${error}`)
      }
    }
  }
  
  console.log(`   ✅ Created ${notificationCount} notifications`)
  return notificationCount
}

async function createPayrollReports(org: any, usersByRole: any) {
  console.log(`   💰 Creating payroll reports for ${org.name}...`)

  const today = getToday()
  const currentMonth = (today.getMonth() + 1).toString().padStart(2, '0')
  const currentYear = today.getFullYear()
  const period = `${currentYear}-${currentMonth}`

  const reports = [
    {
      title: 'Monthly Driver Payroll',
      type: 'DRIVER',
      status: PaymentStatus.PROCESSED,
      recipients: usersByRole.drivers || []
    },
    {
      title: 'Management Compensation',
      type: 'MANAGEMENT', 
      status: PaymentStatus.PENDING,
      recipients: [...(usersByRole.managers || []), ...(usersByRole.admins || [])]
    }
  ]

  let reportCount = 0
  for (let i = 0; i < reports.length; i++) {
    const report = reports[i]

    for (const recipient of report.recipients.slice(0, 3)) { // Limit to 3 per report type
      try {
        const baseAmount = report.type === 'DRIVER' ? 3000 : 5000
        const totalPayment = baseAmount + Math.random() * 1000
        const workedDays = Math.floor(Math.random() * 8) + 20 // 20-28 days
        const dailyRate = totalPayment / workedDays
        const hoursWorked = workedDays * 8 + Math.random() * 20 // Some overtime

        await prisma.payrollReport.upsert({
          where: { id: generateSeedId('payroll', `${org.id}-${i}-${recipient.user.id}`) },
          update: { 
            organizationId: org.id 
          },
          create: { 
            id: generateSeedId('payroll', `${org.id}-${i}-${recipient.user.id}`),
            period: period,
            month: currentMonth,
            year: currentYear,
            workedDays: workedDays,
            dailyRate: dailyRate,
            totalPayment: totalPayment,
            hoursWorked: hoursWorked,
            overtimeHours: Math.max(0, hoursWorked - (workedDays * 8)),
            deductions: totalPayment * 0.05,
            bonuses: Math.random() > 0.5 ? totalPayment * 0.1 : 0,
            efficiency: Math.floor(Math.random() * 20) + 80, // 80-100%
            utilizationRate: Math.floor(Math.random() * 30) + 70, // 70-100%
            status: report.status,
            payDate: report.status === PaymentStatus.PROCESSED ? new Date() : undefined,
            paidAt: report.status === PaymentStatus.PROCESSED ? new Date() : undefined,
            organizationId: org.id 
          },
        })
        reportCount++
      } catch (error) {
        console.log(`     ⚠️  Could not create payroll report for ${recipient.user.name}: ${error}`)
      }
    }
  }
  
  console.log(`   ✅ Created ${reportCount} payroll reports`)
  return reportCount
}

async function seedOrganization(org: any) {
  console.log(`\n🏢 Seeding organization: ${org.name} (${org.slug})`)
  
  // Get users and their roles in this organization
  const { usersByRole } = await getUsersByRole(org.id)
  
  console.log(`   👥 Members: ${Object.values(usersByRole).flat().length}`)
  Object.entries(usersByRole).forEach(([role, members]: [string, any[]]) => {
    if (members.length > 0) {
      console.log(`     ${role}: ${members.length}`)
    }
  })

  // Create organizational structure
  const { departments, shifts } = await createDepartmentsAndShifts(org)
  
  // Create employee records
  await createEmployeesFromMembers(org, departments, shifts, usersByRole)
  
  // Create drivers
  const drivers = await createDriversFromMembers(org, usersByRole)
  
  // Create vehicle infrastructure
  const categories = await createVehicleCategories(org)
  const vehicles = await createVehiclesForOrg(org, categories, drivers)
  
  // Create routes and operations
  const routes = await createRoutesAndStops(org, vehicles, shifts)
  
  // Create availability and scheduling
  await createVehicleAvailability(org, vehicles, drivers, routes, shifts)
  
  // Create business processes
  await createVehicleRequests(org, categories, usersByRole)
  await createNotifications(org, usersByRole)
  await createPayrollReports(org, usersByRole)
  
  console.log(`   ✅ Completed seeding for ${org.name}`)
}

async function main() {
  console.log('🌱 Starting comprehensive database seeding for all organizations...')

  // Get all existing organizations
  const organizations = await getExistingOrganizations()

  // Seed each organization
  for (const org of organizations) {
    await seedOrganization(org)
  }

  console.log('\n🎉 Database seeding completed successfully!')

  // Final verification
  console.log('\n📊 Final Summary:')
  const finalCounts = await Promise.all([
    prisma.organization.count(),
    prisma.member.count(),
    prisma.driver.count(),
    prisma.vehicle.count(),
    prisma.route.count(),
    prisma.stop.count(),
    prisma.employee.count(),
    prisma.vehicleAvailability.count(),
    prisma.vehicleRequest.count(),
    prisma.notification.count(),
    prisma.payrollReport.count(),
  ])

  const [
    orgCount, memberCount, driverCount, vehicleCount, 
    routeCount, stopCount, employeeCount, availabilityCount,
    requestCount, notificationCount, payrollCount
  ] = finalCounts

  console.log(`   Organizations: ${orgCount}`)
  console.log(`   Members: ${memberCount}`)
  console.log(`   Drivers: ${driverCount}`)
  console.log(`   Vehicles: ${vehicleCount}`)
  console.log(`   Routes: ${routeCount}`)
  console.log(`   Stops: ${stopCount}`)
  console.log(`   Employees: ${employeeCount}`)
  console.log(`   Vehicle Availability: ${availabilityCount}`)
  console.log(`   Vehicle Requests: ${requestCount}`)
  console.log(`   Notifications: ${notificationCount}`)
  console.log(`   Payroll Reports: ${payrollCount}`)
  
  console.log(`\n✨ Successfully seeded ${orgCount} organizations with comprehensive fleet management data!`)
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
