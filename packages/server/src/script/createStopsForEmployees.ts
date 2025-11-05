import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Addis Ababa stop locations with realistic coordinates and addresses based on real locations
const addisAbabaStops = [
  {
    name: 'Bole International Airport',
    address: 'Bole International Airport, Addis Ababa, Ethiopia',
    latitude: 8.9779,
    longitude: 38.7994
  },
  {
    name: 'Piassa Central Transport Hub',
    address: 'Piassa Central Business District, Addis Ababa, Ethiopia',
    latitude: 9.0336984,
    longitude: 38.7547538
  },
  {
    name: 'Merkato Market Terminal',
    address: 'Merkato Market Area, Addis Ababa, Ethiopia',
    latitude: 9.0309985,
    longitude: 38.7370686
  },
  {
    name: 'Kazanchis District Stop',
    address: 'Kazanchis Commercial District, Addis Ababa, Ethiopia',
    latitude: 9.0159277,
    longitude: 38.7712221
  },
  {
    name: 'Mexico Square Station',
    address: 'Mexico Square, Addis Ababa, Ethiopia',
    latitude: 9.0103817,
    longitude: 38.7444829
  },
  {
    name: 'Shiromeda Market Stop',
    address: 'Shiromeda Market Area, Addis Ababa, Ethiopia',
    latitude: 9.0605328,
    longitude: 38.7613693
  },
  {
    name: 'Entoto Hill Station',
    address: 'Entoto Hill Residential Area, Addis Ababa, Ethiopia',
    latitude: 9.0626389,
    longitude: 38.761254
  },
  {
    name: 'Ayat Condominiums Stop',
    address: 'Ayat Condominiums, Addis Ababa, Ethiopia',
    latitude: 9.0345734,
    longitude: 38.8460555
  },
  {
    name: 'CMC Technology District',
    address: 'CMC Technology District, Addis Ababa, Ethiopia',
    latitude: 9.019766,
    longitude: 38.8475773
  },
  {
    name: 'Gerji Commercial Stop',
    address: 'Gerji Commercial District, Addis Ababa, Ethiopia',
    latitude: 8.9953787,
    longitude: 38.8094849
  },
  {
    name: 'Meskel Square Terminal',
    address: 'Meskel Square, Addis Ababa, Ethiopia',
    latitude: 9.0102293,
    longitude: 38.7606309
  },
  {
    name: 'Kebena District Stop',
    address: 'Kebena Residential Area, Addis Ababa, Ethiopia',
    latitude: 9.0348997,
    longitude: 38.7786041
  },
  {
    name: 'Kality Industrial Zone',
    address: 'Kality Industrial Area, Addis Ababa, Ethiopia',
    latitude: 8.9037834,
    longitude: 38.7680749
  },
  {
    name: 'Lafto Condominium Stop',
    address: 'Lafto Condominium Area, Addis Ababa, Ethiopia',
    latitude: 8.954213,
    longitude: 38.7463883
  },
  {
    name: 'Yeka Abado Station',
    address: 'Yeka Abado Residential Area, Addis Ababa, Ethiopia',
    latitude: 9.0661627,
    longitude: 38.8772707
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

      // Create one unique stop per employee (stopId is unique in schema)
      for (let i = 0; i < employeesWithoutStops.length; i++) {
        const employee = employeesWithoutStops[i]
        const stopData = addisAbabaStops[i % addisAbabaStops.length]
        
        try {
          // Create a unique stop for this employee
          const stop = await prisma.stop.create({
            data: {
              name: `${stopData.name} - ${employee.name}`,
              address: stopData.address,
              latitude: stopData.latitude + (Math.random() - 0.5) * 0.001, // Slight variation
              longitude: stopData.longitude + (Math.random() - 0.5) * 0.001,
              organizationId: org.id
            }
          })

          // Assign the unique stop to the employee
          await prisma.employee.update({
            where: { id: employee.id },
            data: { stopId: stop.id }
          })
          
          totalStopsCreated++
          totalEmployeesAssigned++
        } catch (error) {
          console.log(`⚠️  Could not create/assign stop for ${employee.name}: ${error}`)
        }
      }

      console.log(`Created and assigned ${totalEmployeesAssigned} unique stops for employees in ${org.name}`)
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