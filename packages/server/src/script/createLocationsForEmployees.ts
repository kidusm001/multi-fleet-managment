import { PrismaClient, LocationType } from '@prisma/client'

const prisma = new PrismaClient()

// Addis Ababa location data for organizations
const addisAbabaLocations = [
  {
    name: 'Headquarters',
    address: 'Bole International Airport Area, Addis Ababa, Ethiopia',
    latitude: 8.9779,
    longitude: 38.7994,
    type: LocationType.HQ
  },
  {
    name: 'Piassa Branch',
    address: 'Piassa Central Business District, Addis Ababa, Ethiopia',
    latitude: 9.0301,
    longitude: 38.7408,
    type: LocationType.BRANCH
  },
  {
    name: 'Merkato Depot',
    address: 'Merkato Industrial Area, Addis Ababa, Ethiopia',
    latitude: 9.0331,
    longitude: 38.7374,
    type: LocationType.BRANCH
  },
  {
    name: 'Kazanchis Office',
    address: 'Kazanchis Commercial District, Addis Ababa, Ethiopia',
    latitude: 9.0167,
    longitude: 38.7667,
    type: LocationType.BRANCH
  },
  {
    name: 'Mexico Square Branch',
    address: 'Mexico Square, Addis Ababa, Ethiopia',
    latitude: 9.0122,
    longitude: 38.7578,
    type: LocationType.BRANCH
  }
]

async function createLocationsForEmployees() {
  console.log('🏢 Creating locations and assigning to employees...')

  try {
    // Get all organizations
    const organizations = await prisma.organization.findMany()
    console.log(`Found ${organizations.length} organizations`)

    let totalLocationsCreated = 0
    let totalEmployeesAssigned = 0

    for (const org of organizations) {
      console.log(`\n🏢 Processing organization: ${org.name}`)

      // Get employees without locations
      const employeesWithoutLocations = await prisma.employee.findMany({
        where: {
          organizationId: org.id,
          locationId: null
        }
      })

      console.log(`Found ${employeesWithoutLocations.length} employees without locations`)

      if (employeesWithoutLocations.length === 0) {
        console.log('No employees need locations assigned')
        continue
      }

      // Create locations for this organization
      const createdLocations = []
      for (const locationData of addisAbabaLocations) {
        try {
          const location = await prisma.location.create({
            data: {
              address: locationData.address,
              latitude: locationData.latitude,
              longitude: locationData.longitude,
              type: locationData.type,
              organizationId: org.id
            }
          })
          createdLocations.push(location)
          totalLocationsCreated++
        } catch (error) {
          console.log(`⚠️  Could not create location ${locationData.name}: ${error}`)
        }
      }

      console.log(`Created ${createdLocations.length} locations for ${org.name}`)

      // Assign locations to employees
      for (let i = 0; i < employeesWithoutLocations.length; i++) {
        const employee = employeesWithoutLocations[i]
        const locationIndex = i % createdLocations.length
        const location = createdLocations[locationIndex]

        try {
          await prisma.employee.update({
            where: { id: employee.id },
            data: { locationId: location.id }
          })
          totalEmployeesAssigned++
        } catch (error) {
          console.log(`⚠️  Could not assign location to employee ${employee.name}: ${error}`)
        }
      }

      console.log(`Assigned locations to ${Math.min(employeesWithoutLocations.length, createdLocations.length)} employees in ${org.name}`)
    }

    console.log(`\n✅ Completed!`)
    console.log(`Total locations created: ${totalLocationsCreated}`)
    console.log(`Total employees assigned: ${totalEmployeesAssigned}`)

  } catch (error) {
    console.error('❌ Error creating locations for employees:', error)
    throw error
  }
}

createLocationsForEmployees()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })