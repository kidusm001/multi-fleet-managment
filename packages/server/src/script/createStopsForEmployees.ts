import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Addis Ababa stop locations with realistic coordinates and addresses
const addisAbabaStops = [
  {
    name: 'Bole International Airport',
    address: 'Bole International Airport, Addis Ababa, Ethiopia',
    latitude: 8.9779,
    longitude: 38.7994
  },
  {
    name: 'Piassa Central',
    address: 'Piassa, Addis Ababa, Ethiopia',
    latitude: 9.0301,
    longitude: 38.7408
  },
  {
    name: 'Entoto Hill Station',
    address: 'Entoto Hill, Addis Ababa, Ethiopia',
    latitude: 9.0942,
    longitude: 38.7636
  },
  {
    name: 'Merkato Market',
    address: 'Merkato, Addis Ababa, Ethiopia',
    latitude: 9.0331,
    longitude: 38.7374
  },
  {
    name: 'Kazanchis District',
    address: 'Kazanchis, Addis Ababa, Ethiopia',
    latitude: 9.0167,
    longitude: 38.7667
  },
  {
    name: 'Mexico Square',
    address: 'Mexico Square, Addis Ababa, Ethiopia',
    latitude: 9.0122,
    longitude: 38.7578
  },
  {
    name: 'Shiromeda Market',
    address: 'Shiromeda, Addis Ababa, Ethiopia',
    latitude: 9.0167,
    longitude: 38.7333
  },
  {
    name: 'Old Airport Area',
    address: 'Old Airport, Addis Ababa, Ethiopia',
    latitude: 9.0333,
    longitude: 38.7667
  },
  {
    name: 'CMC Area',
    address: 'CMC, Addis Ababa, Ethiopia',
    latitude: 9.0167,
    longitude: 38.7833
  },
  {
    name: 'Ayat Condominiums',
    address: 'Ayat, Addis Ababa, Ethiopia',
    latitude: 9.0167,
    longitude: 38.8167
  }
]

async function createStopsForEmployees() {
  console.log('🚏 Creating stops and assigning to employees...')

  try {
    // Get all organizations
    const organizations = await prisma.organization.findMany()
    console.log(`Found ${organizations.length} organizations`)

    let totalStopsCreated = 0
    let totalEmployeesAssigned = 0

    for (const org of organizations) {
      console.log(`\n🏢 Processing organization: ${org.name}`)

      // Get employees without stops
      const employeesWithoutStops = await prisma.employee.findMany({
        where: {
          organizationId: org.id,
          stopId: null
        }
      })

      console.log(`Found ${employeesWithoutStops.length} employees without stops`)

      if (employeesWithoutStops.length === 0) {
        console.log('No employees need stops assigned')
        continue
      }

      // Create stops for this organization
      const createdStops = []
      for (const stopData of addisAbabaStops) {
        try {
          const stop = await prisma.stop.create({
            data: {
              name: stopData.name,
              address: stopData.address,
              latitude: stopData.latitude,
              longitude: stopData.longitude,
              organizationId: org.id
            }
          })
          createdStops.push(stop)
          totalStopsCreated++
        } catch (error) {
          console.log(`⚠️  Could not create stop ${stopData.name}: ${error}`)
        }
      }

      console.log(`Created ${createdStops.length} stops for ${org.name}`)

      // Assign stops to employees
      for (let i = 0; i < employeesWithoutStops.length; i++) {
        const employee = employeesWithoutStops[i]
        const stopIndex = i % createdStops.length
        const stop = createdStops[stopIndex]

        try {
          await prisma.employee.update({
            where: { id: employee.id },
            data: { stopId: stop.id }
          })
          totalEmployeesAssigned++
        } catch (error) {
          console.log(`⚠️  Could not assign stop to employee ${employee.name}: ${error}`)
        }
      }

      console.log(`Assigned stops to ${Math.min(employeesWithoutStops.length, createdStops.length)} employees in ${org.name}`)
    }

    console.log(`\n✅ Completed!`)
    console.log(`Total stops created: ${totalStopsCreated}`)
    console.log(`Total employees assigned: ${totalEmployeesAssigned}`)

  } catch (error) {
    console.error('❌ Error creating stops for employees:', error)
    throw error
  }
}

createStopsForEmployees()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })