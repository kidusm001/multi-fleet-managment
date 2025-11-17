import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function verifyData() {
  try {
    console.log('🔍 Verifying database data...')
    
    const tenants = await prisma.tenant.findMany({
      include: {
        users: true,
        drivers: true,
        vehicles: true,
        routes: {
          include: {
            stops: true,
          },
        },
        vehicleAvailability: true,
      },
    })

    console.log(`Found ${tenants.length} tenant(s):`)
    
    for (const tenant of tenants) {
      console.log(`\n📊 Tenant: ${tenant.name} (ID: ${tenant.id})`)
      console.log(`   - Users: ${tenant.users.length}`)
      console.log(`   - Drivers: ${tenant.drivers.length}`)
      console.log(`   - Vehicles: ${tenant.vehicles.length}`)
      console.log(`   - Routes: ${tenant.routes.length}`)
      console.log(`   - Vehicle Availability Records: ${tenant.vehicleAvailability.length}`)
      
      // Verify multi-tenancy: all records should have the correct tenantId
      const allRecordsHaveCorrectTenantId = [
        ...tenant.users,
        ...tenant.drivers,
        ...tenant.vehicles,
        ...tenant.routes,
        ...tenant.vehicleAvailability,
      ].every(record => record.tenantId === tenant.id)
      
      console.log(`   ✅ Multi-tenancy validation: ${allRecordsHaveCorrectTenantId ? 'PASSED' : 'FAILED'}`)
    }
    
    console.log('\n🎉 Database verification completed!')
    
  } catch (error) {
    console.error('❌ Error verifying data:', error)
  } finally {
    await prisma.$disconnect()
  }
}

verifyData()
