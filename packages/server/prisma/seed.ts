import { PrismaClient, ApprovalStatus, VehicleStatus, RouteStatus, NotificationType, NotificationStatus, DriverStatus, PaymentStatus } from '@prisma/client'
import { createAdditionalEmployees } from './employee-data'
import { auth } from '../src/lib/auth'
import * as fs from 'fs'
import * as path from 'path'

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



// Helper function to load location data from CSV
function loadLocationData(): Array<{district: string, subArea: string, latitude: number, longitude: number}> {
  try {
    const csvPath = path.join(process.cwd(), 'Final.csv')
    const csvContent = fs.readFileSync(csvPath, 'utf-8')
    const lines = csvContent.split('\n').slice(1) // Skip header
    
    const locations = lines
      .filter(line => line.trim())
      .map(line => {
        const [district, subArea, lat, lng] = line.split(',')
        return {
          district: district?.trim(),
          subArea: subArea?.trim(),
          latitude: parseFloat(lat?.trim()),
          longitude: parseFloat(lng?.trim())
        }
      })
      .filter(loc => !isNaN(loc.latitude) && !isNaN(loc.longitude))
    
    console.log(`Loaded ${locations.length} locations from CSV`)
    return locations
  } catch (error) {
    console.log('Could not load CSV data, using fallback locations:', error)
    // Fallback locations if CSV is not available
    return [
      { district: 'Central', subArea: 'Downtown', latitude: 9.0300, longitude: 38.7400 },
      { district: 'Bole', subArea: 'Airport Area', latitude: 8.9800, longitude: 38.8000 },
      { district: 'Kirkos', subArea: 'Kazanchis', latitude: 9.0160, longitude: 38.7710 },
      { district: 'Piassa', subArea: 'Merkato', latitude: 9.0310, longitude: 38.7370 },
      { district: 'Entoto', subArea: 'Residential', latitude: 9.0630, longitude: 38.7610 }
    ]
  }
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

async function createOrganizationLocations(org: any) {
  console.log(`   🏢 Creating locations for ${org.name}...`)

  // Check if HQ location already exists
  const existingHq = await prisma.location.findFirst({
    where: {
      organizationId: org.id,
      type: 'HQ'
    }
  });

  if (existingHq) {
    console.log(`   ⚠️  HQ location already exists for ${org.name}`)
    return existingHq;
  }

  // HQ and branch locations for each organization - using Addis Ababa coordinates for consistency
  const locationData: Record<string, any[]> = {
    'mitchell-transport': [
      {
        address: '1234 Industrial Blvd, Addis Ababa, Ethiopia',
        latitude: 9.0300,
        longitude: 38.7400,
        type: 'HQ'
      },
      {
        address: '5678 Warehouse District, Addis Ababa, Ethiopia',
        latitude: 9.0320,
        longitude: 38.7420,
        type: 'BRANCH'
      },
      {
        address: '9012 Downtown Terminal, Addis Ababa, Ethiopia',
        latitude: 9.0340,
        longitude: 38.7440,
        type: 'BRANCH'
      }
    ],
    'metro-transit': [
      {
        address: '5678 Transit Plaza, Addis Ababa, Ethiopia',
        latitude: 9.0360,
        longitude: 38.7460,
        type: 'HQ'
      },
      {
        address: '1234 North Station, Addis Ababa, Ethiopia',
        latitude: 9.0380,
        longitude: 38.7480,
        type: 'BRANCH'
      },
      {
        address: '9012 South Depot, Addis Ababa, Ethiopia',
        latitude: 9.0400,
        longitude: 38.7500,
        type: 'BRANCH'
      }
    ],
    'garcia-freight': [
      {
        address: '9012 Freight Way, Addis Ababa, Ethiopia',
        latitude: 9.0420,
        longitude: 38.7520,
        type: 'HQ'
      },
      {
        address: '3456 Logistics Center, Addis Ababa, Ethiopia',
        latitude: 9.0440,
        longitude: 38.7540,
        type: 'BRANCH'
      },
      {
        address: '7890 Distribution Hub, Addis Ababa, Ethiopia',
        latitude: 9.0460,
        longitude: 38.7560,
        type: 'BRANCH'
      }
    ],
    'johnson-delivery': [
      {
        address: '3456 Delivery Drive, Addis Ababa, Ethiopia',
        latitude: 9.0480,
        longitude: 38.7580,
        type: 'HQ'
      },
      {
        address: '1234 Express Lane, Addis Ababa, Ethiopia',
        latitude: 9.0500,
        longitude: 38.7600,
        type: 'BRANCH'
      },
      {
        address: '5678 Courier Center, Addis Ababa, Ethiopia',
        latitude: 9.0520,
        longitude: 38.7620,
        type: 'BRANCH'
      }
    ],
    'sterling-logistics': [
      {
        address: '7890 Logistics Lane, Addis Ababa, Ethiopia',
        latitude: 9.0540,
        longitude: 38.7640,
        type: 'HQ'
      },
      {
        address: '1234 Supply Chain Blvd, Addis Ababa, Ethiopia',
        latitude: 9.0560,
        longitude: 38.7660,
        type: 'BRANCH'
      },
      {
        address: '5678 Fulfillment Center, Addis Ababa, Ethiopia',
        latitude: 9.0580,
        longitude: 38.7680,
        type: 'BRANCH'
      },
      {
        address: '9012 Warehouse Complex, Addis Ababa, Ethiopia',
        latitude: 9.0600,
        longitude: 38.7700,
        type: 'BRANCH'
      }
    ]
  };

  const locations = locationData[org.slug] || [
    {
      address: `${org.name} Headquarters, Main Street, Addis Ababa, Ethiopia`,
      latitude: 9.0300 + (Math.random() - 0.5) * 0.1,
      longitude: 38.7400 + (Math.random() - 0.5) * 0.1,
      type: 'HQ'
    },
    {
      address: `${org.name} Branch Office, Second Street, Addis Ababa, Ethiopia`,
      latitude: 9.0320 + (Math.random() - 0.5) * 0.1,
      longitude: 38.7420 + (Math.random() - 0.5) * 0.1,
      type: 'BRANCH'
    }
  ];

  const createdLocations: any[] = [];
  for (const locData of locations) {
    const location = await prisma.location.create({
      data: {
        address: locData.address,
        latitude: locData.latitude,
        longitude: locData.longitude,
        type: locData.type,
        organizationId: org.id
      }
    });
    createdLocations.push(location);
  }

  const hqLocation = createdLocations.find(loc => loc.type === 'HQ');
  console.log(`   ✅ Created ${createdLocations.length} locations (${createdLocations.filter(l => l.type === 'HQ').length} HQ, ${createdLocations.filter(l => l.type === 'BRANCH').length} branches)`)
  return hqLocation;
}

async function createDepartmentsAndShifts(org: any) {
  console.log(`   📂 Creating departments and shifts for ${org.name}...`)

  // Create departments specific to fleet management
  const departments = [
    { name: 'Fleet Operations', orgId: org.id },
    { name: 'Vehicle Maintenance', orgId: org.id },
    { name: 'Administration', orgId: org.id },
  ]

  const createdDepartments: any[] = []
  for (const dept of departments) {
    const department = await prisma.department.create({
      data: { 
        name: dept.name, 
        organizationId: dept.orgId 
      },
    })
    createdDepartments.push(department)
  }

  // Create realistic shifts for fleet operations (only once per organization)
  const existingShifts = await prisma.shift.findMany({
    where: { organizationId: org.id }
  });

  let createdShifts: any[] = [];
  if (existingShifts.length === 0) {
    const now = new Date()
    const shifts = [
      {
        name: 'Morning Shift',
        startHour: 6,
        endHour: 14
      },
      {
        name: 'Afternoon Shift',
        startHour: 14,
        endHour: 22
      },
      {
        name: 'Night Shift',
        startHour: 22,
        endHour: 6
      }
    ]

    for (const shiftData of shifts) {
      const startTime = new Date(now)
      startTime.setHours(shiftData.startHour, 0, 0, 0)
      const endTime = new Date(now)
      endTime.setHours(shiftData.endHour, 0, 0, 0)

      const shift = await prisma.shift.create({
        data: {
          name: shiftData.name,
          startTime: startTime,
          endTime: endTime,
          timeZone: 'UTC',
          organizationId: org.id,
        },
      })
      createdShifts.push(shift)
    }
  } else {
    createdShifts = existingShifts;
    console.log(`   ⚠️  Shifts already exist for ${org.name}, using existing ones`)
  }

  console.log(`   ✅ Created ${createdDepartments.length} departments and ${createdShifts.length} shifts`)
  return { departments: createdDepartments, shifts: createdShifts }
}
async function createEmployeesFromMembers(org: any, departments: any[], shifts: any[], usersByRole: any, locations: any[]) {
  console.log(`   👥 Creating employee records and stops for ${org.name}...`)

  // Load location data from CSV
  const locationData = loadLocationData()

  const employeeRoles = ['admin', 'manager', 'employee']
  const eligibleMembers = Object.values(usersByRole).flat().filter((member: any) => 
    employeeRoles.includes(member.role)
  ) as any[]

  // Special handling for Sterling Logistics - create more concentrated employee groups
  let employeesToCreate = eligibleMembers
  if (org.slug === 'sterling-logistics') {
    console.log(`   📈 Sterling Logistics: Creating concentrated employee groups (30+ per shift/location)`)
    
    // For Sterling Logistics, create multiple employees per shift/location combination
    // to ensure at least 30 employees per shift per location
    const concentratedEmployees = []
    
    // Get all locations for Sterling Logistics
    const allLocations = await prisma.location.findMany({
      where: { organizationId: org.id }
    })
    
    // For each shift, create employees concentrated in ALL locations
    for (const shift of shifts) {
      for (const location of allLocations) {
        // Create 30-35 employees per shift/location combination
        const employeesForThisCombo = Math.floor(Math.random() * 6) + 30 // 30-35 employees
        
        for (let i = 0; i < employeesForThisCombo; i++) {
          // Use existing members in round-robin fashion
          const member = eligibleMembers[i % eligibleMembers.length]
          concentratedEmployees.push({
            member,
            department: departments[Math.floor(Math.random() * departments.length)],
            shift,
            location
          })
        }
      }
    }
    
    // Convert to the format expected by the rest of the function
    employeesToCreate = concentratedEmployees.map(item => item.member)
    
    // Store the concentrated assignments for later use
    ;(global as any).sterlingAssignments = concentratedEmployees
  }

  let createdEmployees = 0
  for (let i = 0; i < employeesToCreate.length; i++) {
    const member = employeesToCreate[i]
    
    // Get pre-assigned values for Sterling Logistics, or random for others
    let department, shift, location
    if (org.slug === 'sterling-logistics' && (global as any).sterlingAssignments) {
      const assignment = (global as any).sterlingAssignments[i]
      department = assignment.department
      shift = assignment.shift
      location = assignment.location
    } else {
      department = getRandomElement(departments)
      shift = getRandomElement(shifts)
      location = getRandomElement(locations) // Randomly assign to any location
    }

    // Get a random location from CSV data, or generate one if not enough data
    let employeeLocation = getRandomElement(locationData)
    if (!employeeLocation) {
      // Fallback if CSV data is insufficient
      employeeLocation = {
        district: 'Central',
        subArea: `${member.user.name}'s Area`,
        latitude: 9.0300 + (Math.random() - 0.5) * 0.1,
        longitude: 38.7400 + (Math.random() - 0.5) * 0.1
      }
    }

    // Create a pickup stop for this employee using real location data
    const employeeStop = await prisma.stop.create({
      data: {
        name: `${employeeLocation.subArea} - ${member.user.name} Pickup`,
        address: `${employeeLocation.district}, ${employeeLocation.subArea}, Addis Ababa`,
        latitude: employeeLocation.latitude,
        longitude: employeeLocation.longitude,
        organizationId: org.id
      }
    })

    try {
      await prisma.employee.create({
        data: { 
          name: member.user.name, 
          location: location.address, 
          locationId: location.id,
          stopId: employeeStop.id, // Assign the pickup stop
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
  
  console.log(`   ✅ Created ${createdEmployees} employee records with realistic pickup stops`)
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
            name: member.user.name, 
            email: member.user.email,
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
    { name: 'Compact Shuttle', capacity: 4 },
    { name: 'Standard Shuttle', capacity: 6 },
    { name: 'Large Shuttle', capacity: 8 },
    { name: 'Mini Coach', capacity: 12 },
  ]

  const createdCategories: any[] = []
  for (const cat of categories) {
    const category = await prisma.vehicleCategory.create({
      data: { 
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

  // Create more vehicles with desired capacity distribution
  // Most should be 4 and 6, some 8 and 12, none over 20
  const vehicleTemplates = [
    // 4-seat vehicles (most common)
    { name: 'Compact Shuttle A1', plateNumber: 'CMP-001', model: 'Toyota Hiace Compact', make: 'Toyota', year: 2023, status: VehicleStatus.AVAILABLE },
    { name: 'Compact Shuttle A2', plateNumber: 'CMP-002', model: 'Toyota Hiace Compact', make: 'Toyota', year: 2023, status: VehicleStatus.AVAILABLE },
    { name: 'Compact Shuttle A3', plateNumber: 'CMP-003', model: 'Toyota Hiace Compact', make: 'Toyota', year: 2023, status: VehicleStatus.AVAILABLE },
    { name: 'Compact Shuttle A4', plateNumber: 'CMP-004', model: 'Toyota Hiace Compact', make: 'Toyota', year: 2023, status: VehicleStatus.AVAILABLE },
    { name: 'Compact Shuttle A5', plateNumber: 'CMP-005', model: 'Toyota Hiace Compact', make: 'Toyota', year: 2023, status: VehicleStatus.AVAILABLE },

    // 6-seat vehicles (most common)
    { name: 'Standard Shuttle B1', plateNumber: 'STD-001', model: 'Ford Transit Standard', make: 'Ford', year: 2022, status: VehicleStatus.AVAILABLE },
    { name: 'Standard Shuttle B2', plateNumber: 'STD-002', model: 'Ford Transit Standard', make: 'Ford', year: 2022, status: VehicleStatus.AVAILABLE },
    { name: 'Standard Shuttle B3', plateNumber: 'STD-003', model: 'Ford Transit Standard', make: 'Ford', year: 2022, status: VehicleStatus.AVAILABLE },
    { name: 'Standard Shuttle B4', plateNumber: 'STD-004', model: 'Ford Transit Standard', make: 'Ford', year: 2022, status: VehicleStatus.AVAILABLE },
    { name: 'Standard Shuttle B5', plateNumber: 'STD-005', model: 'Ford Transit Standard', make: 'Ford', year: 2022, status: VehicleStatus.AVAILABLE },

    // 8-seat vehicles (some)
    { name: 'Large Shuttle C1', plateNumber: 'LRG-001', model: 'Mercedes Sprinter Large', make: 'Mercedes', year: 2021, status: VehicleStatus.AVAILABLE },
    { name: 'Large Shuttle C2', plateNumber: 'LRG-002', model: 'Mercedes Sprinter Large', make: 'Mercedes', year: 2021, status: VehicleStatus.AVAILABLE },
    { name: 'Large Shuttle C3', plateNumber: 'LRG-003', model: 'Mercedes Sprinter Large', make: 'Mercedes', year: 2021, status: VehicleStatus.AVAILABLE },

    // 12-seat vehicles (some)
    { name: 'Mini Coach D1', plateNumber: 'MNC-001', model: 'Toyota Coaster Mini', make: 'Toyota', year: 2020, status: VehicleStatus.AVAILABLE },
    { name: 'Mini Coach D2', plateNumber: 'MNC-002', model: 'Toyota Coaster Mini', make: 'Toyota', year: 2020, status: VehicleStatus.AVAILABLE },

    // Maintenance and inactive vehicles
    { name: 'Maintenance Shuttle', plateNumber: 'MNT-001', model: 'Ford Transit', make: 'Ford', year: 2019, status: VehicleStatus.MAINTENANCE },
    { name: 'Backup Shuttle', plateNumber: 'BCK-001', model: 'Toyota Hiace', make: 'Toyota', year: 2018, status: VehicleStatus.INACTIVE },
  ]

  const createdVehicles: any[] = []
  for (const template of vehicleTemplates) {
    // Map template to appropriate category based on capacity
    let category;
    if (template.name.includes('Compact')) {
      category = categories.find(c => c.capacity === 4);
    } else if (template.name.includes('Standard')) {
      category = categories.find(c => c.capacity === 6);
    } else if (template.name.includes('Large')) {
      category = categories.find(c => c.capacity === 8);
    } else if (template.name.includes('Mini Coach')) {
      category = categories.find(c => c.capacity === 12);
    } else {
      // For maintenance/backup vehicles, assign randomly
      category = getRandomElement(categories);
    }

    const driver = template.status === VehicleStatus.AVAILABLE && drivers.length > 0 ? 
      getRandomElement(drivers) : null

    // Make plate numbers unique per organization
    const uniquePlateNumber = `${template.plateNumber}-${org.slug.toUpperCase()}`

    try {
      const vehicle = await prisma.vehicle.create({
        data: { 
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
  console.log(`   🗺️  Skipping route creation (create your own routes)...`)
  
  // No longer creating fake seed routes - users should create their own
  const createdRoutes: any[] = []
  
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

        await prisma.vehicleAvailability.create({
          data: { 
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

        await prisma.vehicleAvailability.create({
          data: { 
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
  for (const template of requestTemplates) {
    const category = getRandomElement(categories)

    try {
      await prisma.vehicleRequest.create({
        data: { 
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
  for (const template of notificationTemplates) {
    const recipients = usersByRole[template.recipientRole + 's'] || []

    for (const recipient of recipients.slice(0, 2)) { // Limit to 2 recipients per role
      try {
        await prisma.notification.create({
          data: { 
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
  for (const report of reports) {
    for (const recipient of report.recipients.slice(0, 3)) { // Limit to 3 per report type
      try {
        const baseAmount = report.type === 'DRIVER' ? 3000 : 5000
        const totalPayment = baseAmount + Math.random() * 1000
        const workedDays = Math.floor(Math.random() * 8) + 20 // 20-28 days
        const dailyRate = totalPayment / workedDays
        const hoursWorked = workedDays * 8 + Math.random() * 20 // Some overtime

        await prisma.payrollReport.create({
          data: { 
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
  const hqLocation = await createOrganizationLocations(org)
  const allLocations = await prisma.location.findMany({
    where: { organizationId: org.id }
  })
  const { departments, shifts } = await createDepartmentsAndShifts(org)
  
  // Create employee records
  await createEmployeesFromMembers(org, departments, shifts, usersByRole, allLocations)
  
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
  
  // Create additional employees from employee-data.ts
  await createAdditionalEmployees(org.id, prisma, auth)
  
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
