import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireSession, requireRoles } from '../middleware/auth';

const prisma = new PrismaClient();
const router = Router();

// Apply session loading middleware to all routes
router.use(requireSession);

// Debug logging for route operations
router.use((req, _res, next) => {
  // console.log(`[routes] ${req.method} ${req.path} - tenantId: ${req.sessionUser?.tenantId}`);
  next();
});

// GET /routes - List all routes for the current tenant
router.get('/', requireRoles('ADMIN', 'MANAGER', 'DRIVER'), async (req, res) => {
  try {
    const routes = await prisma.route.findMany({
      where: { 
        tenantId: req.sessionUser!.tenantId,
        deleted: false 
      },
      include: {
        stops: {
          where: { tenantId: req.sessionUser!.tenantId },
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
router.get('/:id', requireRoles('ADMIN', 'MANAGER', 'DRIVER'), async (req, res) => {
  try {
    const route = await prisma.route.findFirst({
      where: { 
        id: req.params.id,
        tenantId: req.sessionUser!.tenantId,
        deleted: false
      },
      include: {
        stops: {
          where: { tenantId: req.sessionUser!.tenantId },
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
router.post('/', requireRoles('ADMIN', 'MANAGER'), async (req, res) => {
  try {
    const { name, description, vehicleId, shiftId, date, startTime, endTime } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Route name is required' });
    }
    
    // Validate vehicle belongs to same tenant if provided
    if (vehicleId) {
      const vehicle = await prisma.vehicle.findFirst({
        where: { id: vehicleId, tenantId: req.sessionUser!.tenantId, deleted: false }
      });
      if (!vehicle) {
        return res.status(400).json({ error: 'Invalid vehicle ID' });
      }
    }
    
    // Validate shift belongs to same tenant if provided
    if (shiftId) {
      const shift = await prisma.shift.findFirst({
        where: { id: shiftId, tenantId: req.sessionUser!.tenantId }
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
        tenantId: req.sessionUser!.tenantId
      },
      include: {
        stops: {
          where: { tenantId: req.sessionUser!.tenantId },
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
router.put('/:id', requireRoles('ADMIN', 'MANAGER'), async (req, res) => {
  try {
    const { name, description, vehicleId, shiftId, date, startTime, endTime, status } = req.body;
    
    // Check if route exists and belongs to tenant
    const existingRoute = await prisma.route.findFirst({
      where: { 
        id: req.params.id,
        tenantId: req.sessionUser!.tenantId,
        deleted: false
      }
    });
    
    if (!existingRoute) {
      return res.status(404).json({ error: 'Route not found' });
    }
    
    // Validate vehicle belongs to same tenant if provided
    if (vehicleId) {
      const vehicle = await prisma.vehicle.findFirst({
        where: { id: vehicleId, tenantId: req.sessionUser!.tenantId, deleted: false }
      });
      if (!vehicle) {
        return res.status(400).json({ error: 'Invalid vehicle ID' });
      }
    }
    
    // Validate shift belongs to same tenant if provided
    if (shiftId) {
      const shift = await prisma.shift.findFirst({
        where: { id: shiftId, tenantId: req.sessionUser!.tenantId }
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
          where: { tenantId: req.sessionUser!.tenantId },
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
router.delete('/:id', requireRoles('ADMIN', 'MANAGER'), async (req, res) => {
  try {
    // Check if route exists and belongs to tenant
    const existingRoute = await prisma.route.findFirst({
      where: { 
        id: req.params.id,
        tenantId: req.sessionUser!.tenantId,
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
