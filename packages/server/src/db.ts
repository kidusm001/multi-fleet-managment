import { PrismaClient } from '@prisma/client';

// Singleton Prisma client for server package
const prisma = new PrismaClient();
export default prisma;
