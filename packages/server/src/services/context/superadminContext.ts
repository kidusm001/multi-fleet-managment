import prisma from '../../db';

export async function buildSuperadminContext(): Promise<string> {
  const [orgCount, userCount, activeUsers] = await Promise.all([
    prisma.organization.count(),
    prisma.user.count(),
    prisma.session.count({ where: { expiresAt: { gte: new Date() } } }),
  ]);

  return [
    'System Overview:',
    `- Total Organizations: ${orgCount}`,
    `- Total Users: ${userCount}`,
    `- Active Sessions: ${activeUsers}`,
  ].join('\n');
}
