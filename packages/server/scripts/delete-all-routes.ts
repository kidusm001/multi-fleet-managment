import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🗑️  Deleting all routes and stops...\n')

  // Delete all stops first (due to foreign key constraint)
  const deletedStops = await prisma.stop.deleteMany({})
  console.log(`   ✅ Deleted ${deletedStops.count} stops`)

  // Delete all routes
  const deletedRoutes = await prisma.route.deleteMany({})
  console.log(`   ✅ Deleted ${deletedRoutes.count} routes`)

  console.log('\n🎉 All routes and stops have been removed!')
}

main()
  .catch((e) => {
    console.error('Error deleting routes:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
