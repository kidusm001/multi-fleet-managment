import { PrismaClient } from '@prisma/client';
import {getAvailableShuttles} from '../../services/shuttleAvailabilityService';
const prisma = new PrismaClient();

async function seedMockData() {
  try {
    // Clear existing data
    await prisma.$transaction([
      prisma.route.deleteMany(),
      prisma.shuttle.deleteMany(),
      prisma.shift.deleteMany(),
      prisma.department.deleteMany(),
      prisma.employee.deleteMany(),
      prisma.stop.deleteMany(),
    ]);

    // Create departments
    const department = await prisma.department.create({
      data: {
        name: 'Engineering'
      }
    });

    // Create shifts
    const morningShift = await prisma.shift.create({
      data: {
        name: 'Morning Shift',
        startTime: new Date('2024-12-28T09:00:00Z'),
        endTime: new Date('2024-12-28T17:00:00Z'),
        timeZone: 'America/New_York'
      }
    });

    const eveningShift = await prisma.shift.create({
      data: {
        name: 'Evening Shift',
        startTime: new Date('2024-12-28T17:00:00Z'),
        endTime: new Date('2024-12-29T01:00:00Z'),
        timeZone: 'America/New_York'
      }
    });

    // Create shuttles
    const shuttles = await Promise.all([
      prisma.shuttle.create({
        data: {
          name: 'Shuttle A',
          model: 'Toyota HiAce',
          type: 'in-house',
          status: 'active',
          capacity: 15,
          licensePlate: 'ABC123',
          dailyRate: 100.00,
          categoryId: 1 // Assuming category exists
        }
      }),
      prisma.shuttle.create({
        data: {
          name: 'Shuttle B',
          model: 'Mercedes Sprinter',
          type: 'in-house',
          status: 'active',
          capacity: 12,
          licensePlate: 'XYZ789',
          dailyRate: 120.00,
          categoryId: 1
        }
      }),
      prisma.shuttle.create({
        data: {
          name: 'Shuttle C',
          model: 'Ford Transit',
          type: 'outsourced',
          status: 'active',
          capacity: 18,
          licensePlate: 'DEF456',
          dailyRate: 150.00,
          vendor: 'Express Transit',
          categoryId: 1
        }
      }),
      prisma.shuttle.create({
        data: {
          name: 'Shuttle D',
          model: 'Toyota Coaster',
          type: 'in-house',
          status: 'maintenance',
          capacity: 20,
          licensePlate: 'MNO321',
          dailyRate: 130.00,
          categoryId: 1
        }
      })
    ]);

    // Create stops
    const stops = await Promise.all([
      prisma.stop.create({
        data: {
          latitude: 40.7128,
          longitude: -74.0060,
          sequence: 1
        }
      }),
      prisma.stop.create({
        data: {
          latitude: 40.7589,
          longitude: -73.9851,
          sequence: 2
        }
      })
    ]);

    // Create employees
    const employees = await Promise.all([
      prisma.employee.create({
        data: {
          name: 'John Doe',
          location: 'Manhattan',
          departmentId: department.id,
          shiftId: morningShift.id,
          stopId: stops[0].id
        }
      }),
      prisma.employee.create({
        data: {
          name: 'Jane Smith',
          location: 'Brooklyn',
          departmentId: department.id,
          shiftId: morningShift.id,
          stopId: stops[1].id
        }
      })
    ]);

    // Create a route for Shuttle A in morning shift (to test availability)
    await prisma.route.create({
      data: {
        name: 'Morning Route 1',
        shuttleId: shuttles[0].id,
        shiftId: morningShift.id,
        date: new Date('2024-12-28'),
        startTime: new Date('2024-12-28T09:00:00Z'),
        endTime: new Date('2024-12-28T10:30:00Z'),
        totalDistance: 15.5,
        totalTime: 90,
        status: 'active'
      }
    });

    console.log('Mock data seeded successfully');
    
    // Return created data for reference
    return {
      shifts: {
        morning: morningShift,
        evening: eveningShift
      },
      shuttles,
      stops,
      employees,
      department
    };

  } catch (error) {
    console.error('Error seeding mock data:', error);
    throw error;
  }
}

// Test cases
async function testAvailableShuttles() {
  try {
    // Seed the data
    const mockData = await seedMockData();
    
    console.log('\nTesting getAvailableShuttles...');
    
    // Test Case 1: Morning Shift
    console.log('\nTest Case 1: Morning Shift');
    console.log('Expected: Shuttles B and C should be available (Shuttle A has route, D is in maintenance)');
    const morningShuttles = await getAvailableShuttles({
      shiftId: mockData.shifts.morning.id
    });
    console.log('Available shuttles:', morningShuttles);

    // Test Case 2: Evening Shift
    console.log('\nTest Case 2: Evening Shift');
    console.log('Expected: Shuttles A, B, and C should be available (no routes scheduled, D in maintenance)');
    const eveningShuttles = await getAvailableShuttles({
      shiftId: mockData.shifts.evening.id
    });
    console.log('Available shuttles:', eveningShuttles);

  } catch (error) {
    console.error('Error running tests:', error);
  }
}

// Export for use in API testing
export { seedMockData, testAvailableShuttles };

// Run tests if this file is executed directly
if (require.main === module) {
  testAvailableShuttles()
    .then(() => prisma.$disconnect())
    .catch(async (e) => {
      console.error(e);
      await prisma.$disconnect();
      process.exit(1);
    });
}