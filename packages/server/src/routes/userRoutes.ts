import { Router } from 'express';
import { PrismaClient, Role } from '@prisma/client';
import { requireRoles, requireSession } from '../middleware/auth';

const prisma = new PrismaClient();
const router = Router();

// GET /api/users - list users with basic filtering/sorting, tenant-scoped
router.get('/', requireSession, requireRoles('ADMIN', 'MANAGER'), async (req, res) => {
  try {
    const sessionUser = req.sessionUser!;
    const {
      limit = '100',
      offset = '0',
      sortBy = 'createdAt',
      sortDirection = 'desc',
      searchValue = '',
      searchField = 'email',
      searchOperator = 'contains',
      filterField,
      filterOperator = 'eq',
      filterValue,
    } = req.query as Record<string, string>;

    const take = Math.min(Math.max(parseInt(String(limit), 10) || 100, 1), 500);
    const skip = Math.max(parseInt(String(offset), 10) || 0, 0);

    const where: any = { tenantId: sessionUser.tenantId };

    // search
    if (searchValue && (searchField === 'email' || searchField === 'name')) {
      const field = searchField as 'email' | 'name';
      if (searchOperator === 'starts_with') where[field] = { startsWith: searchValue, mode: 'insensitive' };
      else if (searchOperator === 'ends_with') where[field] = { endsWith: searchValue, mode: 'insensitive' };
      else where[field] = { contains: searchValue, mode: 'insensitive' };
    }

    // filter (currently only role supported explicitly)
    if (filterField === 'role' && filterValue) {
      if (Object.keys(Role).includes(String(filterValue).toUpperCase())) {
        where.role = String(filterValue).toUpperCase();
      }
    }

    // sorting
    const orderBy: any = {};
    orderBy[sortBy] = (String(sortDirection).toLowerCase() === 'asc') ? 'asc' : 'desc';

    const users = await prisma.user.findMany({
      where,
      orderBy,
      skip,
      take,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        banned: true,
        banReason: true,
        banExpires: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.json({ users, count: users.length });
  } catch (e: any) {
    console.error('[users] list error', e);
    res.status(500).json({ error: 'Failed to list users' });
  }
});

export default router;
