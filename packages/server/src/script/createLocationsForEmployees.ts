import { PrismaClient, LocationType } from '@prisma/client'

const prisma = new PrismaClient()

// Addis Ababa location data for organizations based on real locations
const addisAbabaLocations = [
  {
    name: 'Piassa Headquarters',
    address: 'Piassa Central Business District, Addis Ababa, Ethiopia',
    latitude: 9.0336984,
    longitude: 38.7547538,
    type: LocationType.HQ
  },
  {
    name: 'Bole International Airport Branch',
    address: 'Bole International Airport Area, Addis Ababa, Ethiopia',
    latitude: 8.9779,
    longitude: 38.7994,
    type: LocationType.BRANCH
  },
  {
    name: 'Merkato Industrial Depot',
    address: 'Merkato Industrial Area, Addis Ababa, Ethiopia',
    latitude: 9.0309985,
    longitude: 38.7370686,
    type: LocationType.BRANCH
  },
  {
    name: 'Kazanchis Commercial Office',
    address: 'Kazanchis Commercial District, Addis Ababa, Ethiopia',
    latitude: 9.0159277,
    longitude: 38.7712221,
    type: LocationType.BRANCH
  },
  {
    name: 'Mexico Square Branch',
    address: 'Mexico Square, Addis Ababa, Ethiopia',
    latitude: 9.0103817,
    longitude: 38.7444829,
    type: LocationType.BRANCH
  },
  {
    name: 'Shiromeda Market Office',
    address: 'Shiromeda Market Area, Addis Ababa, Ethiopia',
    latitude: 9.0605328,
    longitude: 38.7613693,
    type: LocationType.BRANCH
  },
  {
    name: 'Entoto Hill Station',
    address: 'Entoto Hill Residential Area, Addis Ababa, Ethiopia',
    latitude: 9.0626389,
    longitude: 38.761254,
    type: LocationType.BRANCH
  },
  {
    name: 'Ayat Condominiums Office',
    address: 'Ayat Condominiums, Addis Ababa, Ethiopia',
    latitude: 9.0345734,
    longitude: 38.8460555,
    type: LocationType.BRANCH
  },
  {
    name: 'CMC Technology Hub',
    address: 'CMC Technology District, Addis Ababa, Ethiopia',
    latitude: 9.019766,
    longitude: 38.8475773,
    type: LocationType.BRANCH
  },
  {
    name: 'Gerji Commercial Center',
    address: 'Gerji Commercial District, Addis Ababa, Ethiopia',
    latitude: 8.9953787,
    longitude: 38.8094849,
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