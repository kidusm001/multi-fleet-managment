import { PrismaClient } from '@prisma/client'

async function main() {
  const prisma = new PrismaClient()

  console.log('🧹 Clearing existing employee and vehicle data...')

  try {
    // Delete in order to respect foreign key constraints
    const deletedEmployees = await prisma.employee.deleteMany()
    console.log(`   Deleted ${deletedEmployees.count} employees`)

    const deletedVehicles = await prisma.vehicle.deleteMany()
    console.log(`   Deleted ${deletedVehicles.count} vehicles`)

    const deletedCategories = await prisma.vehicleCategory.deleteMany()
    console.log(`   Deleted ${deletedCategories.count} vehicle categories`)

    const deletedStops = await prisma.stop.deleteMany()
    console.log(`   Deleted ${deletedStops.count} stops`)

    const deletedRoutes = await prisma.route.deleteMany()
    console.log(`   Deleted ${deletedRoutes.count} routes`)

    const deletedAvailability = await prisma.vehicleAvailability.deleteMany()
    console.log(`   Deleted ${deletedAvailability.count} vehicle availability records`)

    const deletedRequests = await prisma.vehicleRequest.deleteMany()
    console.log(`   Deleted ${deletedRequests.count} vehicle requests`)

    const deletedPayroll = await prisma.payrollReport.deleteMany()
    console.log(`   Deleted ${deletedPayroll.count} payroll reports`)

    const deletedNotifications = await prisma.notification.deleteMany()
    console.log(`   Deleted ${deletedNotifications.count} notifications`)

    console.log('✅ Successfully cleared all employee and vehicle data')
  } catch (error) {
    console.error('❌ Error clearing data:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })