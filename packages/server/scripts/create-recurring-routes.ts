import { PrismaClient, RouteStatus } from '@prisma/client'

const prisma = new PrismaClient()

function getToday() {
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  return now
}

async function main() {
  console.log('🗺️  Creating recurring routes for all organizations...\n')

  const orgs = await prisma.organization.findMany({
    include: {
      vehicles: true,
      shifts: true,
    },
  })

  const routeTemplates = [
    {
      name: 'Downtown Express',
      description: 'Efficient route through downtown area',
      stops: [
        { name: 'Downtown Station', address: '123 Main St', lat: 9.0320, lng: 38.7469 },
        { name: 'City Center Mall', address: '456 Market Ave', lat: 9.0354, lng: 38.7525 },
        { name: 'Business District Hub', address: '789 Commerce Rd', lat: 9.0289, lng: 38.7583 },
      ],
    },
    {
      name: 'Airport Shuttle',
      description: 'Direct connection to airport terminals',
      stops: [
        { name: 'Terminal 1', address: 'Airport Access Rd', lat: 8.9778, lng: 38.7994 },
        { name: 'Terminal 2', address: 'Airport Loop', lat: 8.9789, lng: 38.8006 },
        { name: 'Parking Complex', address: 'Airport Parking', lat: 8.9756, lng: 38.7967 },
      ],
    },
  ]

  const today = getToday()
  const weeksToCreate = 2 // Only create next 2 weeks (10 workdays)
  let totalCreated = 0

  for (const org of orgs) {
    console.log(`📍 Creating routes for ${org.name}...`)
    
    if (org.vehicles.length === 0) {
      console.log(`   ⚠️  No vehicles found for ${org.name}, skipping\n`)
      continue
    }

    let orgRoutesCreated = 0

    // For each week
    for (let week = 0; week < weeksToCreate; week++) {
      // For each weekday (Monday=1, Friday=5)
      for (let dayOfWeek = 1; dayOfWeek <= 5; dayOfWeek++) {
        // Calculate date for this weekday
        const currentDay = today.getDay() // 0=Sunday, 1=Monday, etc.
        let daysToAdd = (week * 7) + (dayOfWeek - currentDay)
        
        // Adjust for if today is Sunday (0)
        if (currentDay === 0) {
          daysToAdd = (week * 7) + dayOfWeek
        }
        
        const routeDate = new Date(today)
        routeDate.setDate(today.getDate() + daysToAdd)
        
        // Skip if date is in the past
        if (routeDate < today) continue
        
        // Create routes from templates
        for (let i = 0; i < Math.min(routeTemplates.length, org.vehicles.length); i++) {
          const template = routeTemplates[i]
          const vehicle = org.vehicles[i]
          const shift = org.shifts[0] // Use first shift
          
          if (!shift) continue
          
          const routeStartTime = new Date(routeDate)
          routeStartTime.setHours(8 + i * 2, 0, 0, 0)
          const routeEndTime = new Date(routeDate)
          routeEndTime.setHours(16 + i * 2, 0, 0, 0)

          try {
            const route = await prisma.route.create({
              data: {
                name: template.name,
                description: template.description,
                vehicleId: vehicle.id,
                shiftId: shift.id,
                date: routeDate,
                startTime: routeStartTime,
                endTime: routeEndTime,
                isActive: true,
                status: RouteStatus.PENDING,
                organizationId: org.id,
              },
            })

            // Create stops for this route
            for (let j = 0; j < template.stops.length; j++) {
              const stopData = template.stops[j]
              await prisma.stop.create({
                data: {
                  name: stopData.name,
                  address: stopData.address,
                  latitude: stopData.lat,
                  longitude: stopData.lng,
                  order: j,
                  routeId: route.id,
                  organizationId: org.id,
                },
              })
            }

            orgRoutesCreated++
          } catch (error) {
            console.log(`     ⚠️  Error creating route: ${error}`)
          }
        }
      }
    }

    console.log(`   ✅ Created ${orgRoutesCreated} routes for ${org.name}\n`)
    totalCreated += orgRoutesCreated
  }

  console.log(`\n🎉 Total routes created: ${totalCreated}`)
}

main()
  .catch((e) => {
    console.error('Error creating recurring routes:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
