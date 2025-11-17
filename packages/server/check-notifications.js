import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

(async () => {
  try {
    const notifications = await prisma.notification.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      select: { 
        id: true,
        type: true, 
        title: true, 
        message: true,
        createdAt: true
      }
    });
    
    console.log('\n=== Recent Notifications ===');
    notifications.forEach((n, i) => {
      console.log(`\n${i + 1}. [${n.type}]`);
      console.log(`   Title: ${n.title}`);
      console.log(`   Message: ${n.message}`);
      console.log(`   Created: ${n.createdAt.toISOString()}`);
    });
    console.log('\n');
    
    // Exit cleanly
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
})();
