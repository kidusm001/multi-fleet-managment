import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanupOrphanedMembers() {
  console.log('🧹 Cleaning up orphaned members...\n');

  try {
    // Find all members
    const allMembers = await prisma.member.findMany({
      include: {
        user: true
      }
    });

    console.log(`📊 Found ${allMembers.length} total members\n`);

    const orphanedMembers = allMembers.filter(member => !member.user);
    
    if (orphanedMembers.length === 0) {
      console.log('✅ No orphaned members found!\n');
      return;
    }

    console.log(`⚠️  Found ${orphanedMembers.length} orphaned members (members without users)\n`);

    // Also check for employees linked to these orphaned members
    for (const member of orphanedMembers) {
      console.log(`🗑️  Deleting member: ${member.id} (userId: ${member.userId})`);
      
      // Delete associated employees first
      const deletedEmployees = await prisma.employee.deleteMany({
        where: { userId: member.userId }
      });
      
      if (deletedEmployees.count > 0) {
        console.log(`   - Deleted ${deletedEmployees.count} associated employee(s)`);
      }
      
      // Delete the orphaned member
      await prisma.member.delete({
        where: { id: member.id }
      });
      
      console.log(`   ✅ Deleted orphaned member\n`);
    }

    console.log(`✅ Cleanup complete! Removed ${orphanedMembers.length} orphaned members\n`);

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

cleanupOrphanedMembers();
