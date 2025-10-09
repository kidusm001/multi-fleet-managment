import { PrismaClient } from '@prisma/client'
import { readFileSync } from 'fs'
import { join } from 'path'

const prisma = new PrismaClient()

// Load Addis Ababa addresses from Final.csv
function loadAddisAbabaAddresses() {
  const csvPath = join(process.cwd(), 'Final.csv')
  const csvContent = readFileSync(csvPath, 'utf-8')
  const lines = csvContent.split('\n').slice(1) // Skip header
  
  return lines
    .filter(line => line.trim())
    .map(line => {
      const [mainDistrict, subArea, lat, lng] = line.split(',')
      return {
        name: `${mainDistrict.trim()}, ${subArea.trim()}`,
        latitude: parseFloat(lat),
        longitude: parseFloat(lng)
      }
    })
    .filter(addr => !isNaN(addr.latitude) && !isNaN(addr.longitude))
}

async function fixMissingStops() {
  console.log('🔧 Fixing employees missing stops...')

  const addisAbabaAddresses = loadAddisAbabaAddresses()
  console.log(`Loaded ${addisAbabaAddresses.length} Addis Ababa addresses from Final.csv`)

  try {
    const orgs = await prisma.organization.findMany()
    for (const org of orgs) {
      console.log(`\n🏢 Organization: ${org.name}`)

      const employees = await prisma.employee.findMany({ 
        where: { organizationId: org.id, stopId: null },
        include: { stop: true }
      })
      console.log(`Found ${employees.length} employees without stops`)

      // Also find employees with stops that have wrong names (containing employee name)
      const employeesWithWrongStops = await prisma.employee.findMany({
        where: { 
          organizationId: org.id, 
          stopId: { not: null },
          stop: {
            name: {
              contains: 'Pickup' // Find stops with the old naming pattern
            }
          }
        },
        include: { stop: true }
      })
      console.log(`Found ${employeesWithWrongStops.length} employees with wrong stop names`)

      const allEmployeesToFix = [...employees, ...employeesWithWrongStops]

      if (allEmployeesToFix.length === 0) continue

      // Create or update stops for each employee using Addis Ababa addresses
      for (let i = 0; i < allEmployeesToFix.length; i++) {
        const emp = allEmployeesToFix[i]
        const addressIndex = i % addisAbabaAddresses.length
        const addressData = addisAbabaAddresses[addressIndex]
        
        try {
          if (emp.stopId) {
            // Update existing stop
            await prisma.stop.update({
              where: { id: emp.stopId },
              data: {
                name: addressData.name,
                address: `${addressData.name}, Addis Ababa, Ethiopia`,
                latitude: addressData.latitude,
                longitude: addressData.longitude
              }
            })
          } else {
            // Create new stop
            const stop = await prisma.stop.create({
              data: {
                name: addressData.name,
                address: `${addressData.name}, Addis Ababa, Ethiopia`,
                latitude: addressData.latitude,
                longitude: addressData.longitude,
                organizationId: org.id
              }
            })
            await prisma.employee.update({ where: { id: emp.id }, data: { stopId: stop.id } })
          }
        } catch (err) {
          console.log(`Could not create/update stop for ${emp.name}: ${err}`)
        }
      }

      console.log(`Fixed stops for ${allEmployeesToFix.length} employees in ${org.name}`)
    }

    console.log('\n✅ Done fixing missing stops')
  } catch (err) {
    console.error('Error fixing missing stops', err)
    throw err
  } finally {
    await prisma.$disconnect()
  }
}

fixMissingStops().catch((e) => {
  console.error(e)
  process.exit(1)
})
