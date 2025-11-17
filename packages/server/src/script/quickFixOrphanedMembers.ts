#!/usr/bin/env tsx
/**
 * Quick fix script to clean up orphaned members and restore database integrity
 * Run this if you're getting "User not found for member" errors
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function quickFix() {
  console.log('\n');
  console.log('╔' + '═'.repeat(78) + '╗');
  console.log('║' + ' '.repeat(20) + '🔧 QUICK FIX: ORPHANED MEMBERS 🔧' + ' '.repeat(25) + '║');
  console.log('╚' + '═'.repeat(78) + '╝');
  console.log('\n');

  try {
    // Step 1: Find and report orphaned members
    console.log('📊 Step 1: Analyzing database...\n');
    
    const allMembers = await prisma.member.findMany({
      include: {
        user: true,
        organization: true
      }
    });

    console.log(`   Total members: ${allMembers.length}`);
    
    const orphanedMembers = allMembers.filter(member => !member.user);
    const validMembers = allMembers.filter(member => !!member.user);
    
    console.log(`   Valid members: ${validMembers.length}`);
    console.log(`   Orphaned members: ${orphanedMembers.length}\n`);

    if (orphanedMembers.length === 0) {
      console.log('✅ No orphaned members found! Database is healthy.\n');
      return;
    }

    // Step 2: Show details of orphaned members
    console.log('⚠️  Step 2: Orphaned members details:\n');
    
    const orphanedByOrg: Record<string, number> = {};
    
    for (const member of orphanedMembers) {
      const orgName = member.organization?.name || 'Unknown';
      orphanedByOrg[orgName] = (orphanedByOrg[orgName] || 0) + 1;
      console.log(`   - Member ID: ${member.id}`);
      console.log(`     User ID: ${member.userId} (USER MISSING)`);
      console.log(`     Organization: ${orgName}`);
      console.log(`     Role: ${member.role}\n`);
    }

    console.log('📈 Orphaned members by organization:');
    for (const [org, count] of Object.entries(orphanedByOrg)) {
      console.log(`   ${org}: ${count} orphaned member(s)`);
    }
    console.log('\n');

    // Step 3: Clean up orphaned members
    console.log('🧹 Step 3: Cleaning up orphaned members...\n');

    let deletedEmployees = 0;
    let deletedMembers = 0;

    for (const member of orphanedMembers) {
      // Delete associated employees first
      const employeeResult = await prisma.employee.deleteMany({
        where: { userId: member.userId }
      });
      
      deletedEmployees += employeeResult.count;
      
      // Delete the orphaned member
      await prisma.member.delete({
        where: { id: member.id }
      });
      
      deletedMembers++;
      
      console.log(`   ✓ Deleted member ${member.id} and ${employeeResult.count} employee(s)`);
    }

    console.log('\n');
    console.log('╔' + '═'.repeat(78) + '╗');
    console.log('║' + ' '.repeat(30) + '✅ CLEANUP COMPLETE ✅' + ' '.repeat(27) + '║');
    console.log('╚' + '═'.repeat(78) + '╝');
    console.log('\n');
    
    console.log('📊 Summary:');
    console.log(`   Orphaned members deleted: ${deletedMembers}`);
    console.log(`   Associated employees deleted: ${deletedEmployees}`);
    console.log(`   Valid members remaining: ${validMembers.length}\n`);
    
    console.log('✅ Database integrity restored!');
    console.log('💡 You can now use the "Add Single Employee" page without errors.\n');

  } catch (error) {
    console.error('\n❌ Error during cleanup:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

quickFix();
