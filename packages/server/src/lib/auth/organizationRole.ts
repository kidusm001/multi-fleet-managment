import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function getUserOrganizationRole(
  userId: string,
  organizationId: string
): Promise<string | undefined> {
  if (!userId || !organizationId) {
    return undefined;
  }

  const member = await prisma.member.findFirst({
    where: {
      userId,
      organizationId,
    },
  });

  return member?.role;
}
