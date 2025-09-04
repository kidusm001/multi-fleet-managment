import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkOrganizations() {
  const orgs = await prisma.organization.findMany({
    include: {
      members: {
        include: {
          user: {
            select: { email: true, name: true }
          }
        }
      }
    },
    orderBy: { name: 'asc' }
  });
  
  console.log('Organizations with Members:');
  console.log('==========================');
  
  for (const org of orgs) {
    console.log(`\n🏢 ${org.name} (${org.slug})`);
    console.log(`   ID: ${org.id}`);
    console.log(`   Members: ${org.members.length}`);
    
    const membersByRole: Record<string, any[]> = {};
    for (const member of org.members) {
      if (!membersByRole[member.role]) membersByRole[member.role] = [];
      membersByRole[member.role].push(member);
    }
    
    Object.entries(membersByRole).forEach(([role, members]) => {
      console.log(`   ${role.toUpperCase()}: ${members.length}`);
      members.forEach(member => {
        console.log(`     - ${member.user.email}`);
      });
    });
  }
  
  console.log(`\n📊 Total organizations: ${orgs.length}`);
  console.log(`📊 Total memberships: ${orgs.reduce((sum, org) => sum + org.members.length, 0)}`);
  
  await prisma.$disconnect();
}

checkOrganizations().catch(console.error);
