import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function findDriverUser() {
  try {
    // Find users who are members with driver role
    const driverMembers = await prisma.member.findMany({
      where: {
        role: 'DRIVER'
      },
      include: {
        user: true,
        organization: true
      }
    });

    if (driverMembers.length > 0) {
      console.log('Found driver members:');
      driverMembers.forEach(member => {
        console.log(`- User: ${member.user.email}, Name: ${member.user.name}, Org: ${member.organization.name}`);
      });
      return;
    }

    // Alternative: find drivers with email addresses and check if they have User accounts
    const driversWithEmail = await prisma.driver.findMany({
      where: {
        email: {
          not: null
        }
      },
      include: {
        organization: true
      }
    });

    if (driversWithEmail.length > 0) {
      console.log('Found drivers with email:');
      for (const driver of driversWithEmail.slice(0, 3)) { // Check first 3
        console.log(`- Driver: ${driver.email}, Name: ${driver.name}, Org: ${driver.organization.name}`);

        // Check if there's a User account with this email
        const user = await prisma.user.findUnique({
          where: { email: driver.email }
        });

        if (user) {
          console.log(`  -> User account exists: ${user.email}, Role: ${user.role}`);
        } else {
          console.log(`  -> No User account found for this email`);
        }
      }
      return;
    }

    console.log('No driver users found in the database.');
  } catch (error) {
    console.error('Error querying database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

findDriverUser();