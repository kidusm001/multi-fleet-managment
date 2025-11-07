// Quick debug script to check RouteCompletion data
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkCompletions() {
  const vehicleId = 'cmhouw5jz00o5gjrfam0hz79v';
  
  console.log('Checking RouteCompletions for vehicle:', vehicleId);
  
  // First, check without organizationId filter
  const allCompletions = await prisma.routeCompletion.findMany({
    where: {
      vehicleId
    },
    include: {
      driver: {
        select: {
          id: true,
          name: true
        }
      },
      vehicle: {
        select: {
          id: true,
          plateNumber: true,
          organizationId: true
        }
      }
    },
    orderBy: {
      completedAt: 'desc'
    },
    take: 10
  });
  
  console.log(`\nFound ${allCompletions.length} completions (without org filter):`);
  console.log(`\nFound ${allCompletions.length} completions (without org filter):`);
  allCompletions.forEach((c, i) => {
    console.log(`\n${i + 1}.`, {
      id: c.id,
      routeId: c.routeId,
      driverId: c.driverId,
      driverName: c.driver?.name,
      organizationId: c.organizationId,
      vehicleOrg: c.vehicle?.organizationId,
      completedAt: c.completedAt,
      completedAtISO: c.completedAt.toISOString(),
      completedAtLocal: c.completedAt.toString()
    });
  });
  
  // Try the same query with date range (if we found any)
  if (allCompletions.length > 0) {
    const orgId = allCompletions[0].organizationId;
    console.log('\n\nUsing organizationId:', orgId);
    
    const testDate = '2025-11-07';
    const startOfDay = new Date(testDate);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(testDate);
    endOfDay.setHours(23, 59, 59, 999);
    
    console.log('\nTesting date range query:');
    console.log('Date string:', testDate);
    console.log('Start of day:', startOfDay.toISOString(), startOfDay.toString());
    console.log('End of day:', endOfDay.toISOString(), endOfDay.toString());
    
    const rangeCompletions = await prisma.routeCompletion.findMany({
      where: {
        vehicleId,
        organizationId: orgId,
        completedAt: {
          gte: startOfDay,
          lte: endOfDay
        }
      }
    });
    
    console.log(`\nFound ${rangeCompletions.length} completions in date range`);
  }
  
  await prisma.$disconnect();
}

checkCompletions().catch(console.error);
