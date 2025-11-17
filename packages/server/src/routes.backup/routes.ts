import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireRole } from '../middleware/requireRole';
import { auth } from '../lib/auth';
import { fromNodeHeaders } from 'better-auth/node';

const prisma = new PrismaClient();
const router = Router();

// Helper function to get session and organization
async function getSession(req: any) {
  const session = await auth.api.getSession({
    headers: fromNodeHeaders(req.headers),
  });

  if (!session?.user) {
    return null;
  }

  // Get user's organization from member table
  const member = await prisma.member.findFirst({
    where: { userId: session.user.id },
    include: { organization: true }
  });

  return {
    ...session,
    organizationId: member?.organizationId || null,
    organization: member?.organization
  };
}

// Session validation is handled by Better Auth middleware at the app level

// Debug logging for route operations
router.use((req, _res, next) => {
  // console.log(`[routes] ${req.method} ${req.path} - tenantId: ${req.sessionUser?.tenantId}`);
  next();
});

// GET /routes - List all routes for the current tenant
router.get('/', requireRole(['ADMIN', 'MANAGER', 'DRIVER']), async (req, res) => {
  try {
    const session = await getSession(req);

    if (!session?.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const routes = await prisma.route.findMany({
      where: {
        organizationId: session.organizationId,
        deleted: false
      },
      include: {
        stops: {
          where: { organizationId: session.organizationId },
          orderBy: { order: 'asc' }
        },
        vehicle: true,
        shift: true
      },
      orderBy: { createdAt: 'desc' }
    });
    
    res.json({ routes });
  } catch (e: any) {
    console.error('GET /routes error:', e);
    res.status(500).json({ error: 'Failed to fetch routes' });
  }
});

// GET /routes/:id - Get specific route for the current tenant
router.get('/:id', requireRole(['ADMIN', 'MANAGER', 'DRIVER']), async (req, res) => {
  try {
    const session = await getSession(req);

    if (!session?.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const route = await prisma.route.findFirst({
      where: {
        id: req.params.id,
        organizationId: session.organizationId,
        deleted: false
      },
      include: {
        stops: {
          where: { organizationId: session.organizationId },
          orderBy: { order: 'asc' }
        },
        vehicle: true,
        shift: true
      }
    });
    
    if (!route) {
      return res.status(404).json({ error: 'Route not found' });
    }
    
    res.json({ route });
  } catch (e: any) {
    console.error('GET /routes/:id error:', e);
    res.status(500).json({ error: 'Failed to fetch route' });
  }
});

// POST /routes - Create new route (ADMIN/MANAGER only)
router.post('/', requireRole(['ADMIN', 'MANAGER']), async (req, res) => {
  try {
    const session = await getSession(req);

    if (!session?.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { name, description, vehicleId, shiftId, date, startTime, endTime } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Route name is required' });
    }
    
    // Validate vehicle belongs to same tenant if provided
    if (vehicleId) {
      const vehicle = await prisma.vehicle.findFirst({
        where: { id: vehicleId, organizationId: session.organizationId, deleted: false }
      });
      if (!vehicle) {
        return res.status(400).json({ error: 'Invalid vehicle ID' });
      }
    }
    
    // Validate shift belongs to same tenant if provided
    if (shiftId) {
      const shift = await prisma.shift.findFirst({
        where: { id: shiftId, organizationId: session.organizationId }
      });
      if (!shift) {
        return res.status(400).json({ error: 'Invalid shift ID' });
      }
    }
    
    const route = await prisma.route.create({
      data: {
        name,
        description: description || null,
        vehicleId: vehicleId || null,
        shiftId: shiftId || null,
        date: date ? new Date(date) : null,
        startTime: startTime ? new Date(startTime) : null,
        endTime: endTime ? new Date(endTime) : null,
        organizationId: session.organizationId
      },
      include: {
        stops: {
          where: { organizationId: session.organizationId },
          orderBy: { order: 'asc' }
        },
        vehicle: true,
        shift: true
      }
    });
    
    res.status(201).json({ route });
  } catch (e: any) {
    console.error('POST /routes error:', e);
    res.status(500).json({ error: 'Failed to create route' });
  }
});

// PUT /routes/:id - Update route (ADMIN/MANAGER only)
router.put('/:id', requireRole(['ADMIN', 'MANAGER']), async (req, res) => {
  try {
    const session = await getSession(req);

    if (!session?.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { name, description, vehicleId, shiftId, date, startTime, endTime, status } = req.body;

    // Check if route exists and belongs to tenant
    const existingRoute = await prisma.route.findFirst({
      where: {
        id: req.params.id,
        organizationId: session.organizationId,
        deleted: false
      }
    });
    
    if (!existingRoute) {
      return res.status(404).json({ error: 'Route not found' });
    }
    
    // Validate vehicle belongs to same tenant if provided
    if (vehicleId) {
      const vehicle = await prisma.vehicle.findFirst({
        where: { id: vehicleId, organizationId: session.organizationId, deleted: false }
      });
      if (!vehicle) {
        return res.status(400).json({ error: 'Invalid vehicle ID' });
      }
    }
    
    // Validate shift belongs to same tenant if provided
    if (shiftId) {
      const shift = await prisma.shift.findFirst({
        where: { id: shiftId, organizationId: session.organizationId }
      });
      if (!shift) {
        return res.status(400).json({ error: 'Invalid shift ID' });
      }
    }
    
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (vehicleId !== undefined) updateData.vehicleId = vehicleId;
    if (shiftId !== undefined) updateData.shiftId = shiftId;
    if (date !== undefined) updateData.date = date ? new Date(date) : null;
    if (startTime !== undefined) updateData.startTime = startTime ? new Date(startTime) : null;
    if (endTime !== undefined) updateData.endTime = endTime ? new Date(endTime) : null;
    if (status !== undefined) updateData.status = status;
    
    const route = await prisma.route.update({
      where: { id: req.params.id },
      data: updateData,
      include: {
        stops: {
          where: { organizationId: session.organizationId },
          orderBy: { order: 'asc' }
        },
        vehicle: true,
        shift: true
      }
    });
    
    res.json({ route });
  } catch (e: any) {
    console.error('PUT /routes/:id error:', e);
    res.status(500).json({ error: 'Failed to update route' });
  }
});

// DELETE /routes/:id - Soft delete route (ADMIN/MANAGER only)
router.delete('/:id', requireRole(['ADMIN', 'MANAGER']), async (req, res) => {
  try {
    // Check if route exists and belongs to tenant
    const existingRoute = await prisma.route.findFirst({
      where: { 
        id: req.params.id,
        organizationId: session.organizationId,
        deleted: false
      }
    });
    
    if (!existingRoute) {
      return res.status(404).json({ error: 'Route not found' });
    }
    
    await prisma.route.update({
      where: { id: req.params.id },
      data: { 
        deleted: true,
        deletedAt: new Date()
      }
    });
    
    res.status(204).send();
  } catch (e: any) {
    console.error('DELETE /routes/:id error:', e);
    res.status(500).json({ error: 'Failed to delete route' });
  }
});

export default router;
