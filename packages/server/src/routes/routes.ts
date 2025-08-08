import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireSession, requireRoles } from '../middleware/auth';

const prisma = new PrismaClient();
const router = Router();

// Apply session loading middleware to all routes
router.use(requireSession);

// Debug logging for route operations
router.use((req, _res, next) => {
  console.log(`[routes] ${req.method} ${req.path} - tenantId: ${req.sessionUser?.tenantId}`);
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

// (LEGACY PORT) GET /routes/unique-locations - routes with unique employee locations
router.get('/unique-locations', requireRoles('ADMIN', 'MANAGER'), async (req, res) => {
  try {
    const tenantId = req.sessionUser!.tenantId;
    const routes = await prisma.route.findMany({
      where: { tenantId, deleted: false },
      include: {
        stops: {
          where: { tenantId },
          include: {
            employee: true,
          }
        }
      }
    });

    const routesWithUnique = routes.map(r => {
      const locSet = new Set<string>();
      for (const s of r.stops) {
        const loc = (s as any).employee?.location;
        if (loc) locSet.add(loc);
      }
      return { ...r, uniqueLocations: Array.from(locSet) };
    });
    res.json({ routes: routesWithUnique });
  } catch (e) {
    console.error('GET /routes/unique-locations error:', e);
    res.status(500).json({ error: 'Failed to fetch unique locations' });
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

// GET /routes/shift/:shiftId - all routes for a shift (tenant scoped)
router.get('/shift/:shiftId', requireRoles('ADMIN', 'MANAGER'), async (req, res) => {
  try {
    const { shiftId } = req.params;
    const tenantId = req.sessionUser!.tenantId;
    const routes = await prisma.route.findMany({
      where: { tenantId, shiftId, deleted: false },
      include: {
        stops: { where: { tenantId }, orderBy: { order: 'asc' } },
        vehicle: true,
        shift: true
      }
    });
    res.json({ routes });
  } catch (e) {
    console.error('GET /routes/shift/:shiftId error:', e);
    res.status(500).json({ error: 'Failed to fetch shift routes' });
  }
});

// GET /routes/:routeId/stops - list stops for route
router.get('/:routeId/stops', requireRoles('ADMIN', 'MANAGER', 'DRIVER'), async (req, res) => {
  try {
    const { routeId } = req.params;
    const tenantId = req.sessionUser!.tenantId;
    const route = await prisma.route.findFirst({ where: { id: routeId, tenantId, deleted: false } });
    if (!route) return res.status(404).json({ error: 'Route not found' });
    const stops = await prisma.stop.findMany({
      where: { routeId, tenantId },
      orderBy: { order: 'asc' },
      include: { employee: true }
    });
    res.json({ stops });
  } catch (e) {
    console.error('GET /routes/:routeId/stops error:', e);
    res.status(500).json({ error: 'Failed to fetch stops' });
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

// PUT /routes/:routeId/stops - replace stop ordering & arrival times (simplified)
router.put('/:routeId/stops', requireRoles('ADMIN', 'MANAGER'), async (req, res) => {
  try {
    const { routeId } = req.params;
    const { stops } = req.body as { stops: Array<{ stopId: string; estimatedArrivalTime?: string }>; };
    const tenantId = req.sessionUser!.tenantId;
    if (!Array.isArray(stops)) return res.status(400).json({ error: 'stops array required' });
    const route = await prisma.route.findFirst({ where: { id: routeId, tenantId, deleted: false } });
    if (!route) return res.status(404).json({ error: 'Route not found' });
    // Disassociate existing stops for this route (tenant scoped)
    await prisma.stop.updateMany({ where: { routeId, tenantId }, data: { routeId: null, sequence: null, estimatedArrivalTime: null } });
    // Re-associate provided stops in order
    for (let i = 0; i < stops.length; i++) {
      const s = stops[i];
      await prisma.stop.update({
        where: { id: s.stopId },
        data: {
          routeId,
          sequence: i + 1,
          estimatedArrivalTime: s.estimatedArrivalTime ? new Date(s.estimatedArrivalTime) : null
        }
      });
    }
    const updated = await prisma.stop.findMany({ where: { routeId, tenantId }, orderBy: { sequence: 'asc' } });
    res.json({ stops: updated });
  } catch (e) {
    console.error('PUT /routes/:routeId/stops error:', e);
    res.status(500).json({ error: 'Failed to update stops' });
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

// PATCH /routes/:id/status/:status - status change mapping
router.patch('/:id/status/:status', requireRoles('ADMIN', 'MANAGER'), async (req, res) => {
  try {
    const { id, status } = req.params;
    const tenantId = req.sessionUser!.tenantId;
    const map: Record<string, string> = { active: 'ACTIVE', inactive: 'INACTIVE', canceled: 'CANCELLED', cancelled: 'CANCELLED' };
    const mapped = map[status.toLowerCase()];
    if (!mapped) return res.status(400).json({ error: 'Unsupported status value' });
    const existing = await prisma.route.findFirst({ where: { id, tenantId, deleted: false } });
    if (!existing) return res.status(404).json({ error: 'Route not found' });
    const updated = await prisma.route.update({ where: { id }, data: { status: mapped as any } });
    res.json({ route: updated });
  } catch (e) {
    console.error('PATCH /routes/:id/status/:status error:', e);
    res.status(500).json({ error: 'Failed to update status' });
  }
});

// PATCH /routes/:id/restore - restore soft deleted route
router.patch('/:id/restore', requireRoles('ADMIN', 'MANAGER'), async (req, res) => {
  try {
    const { id } = req.params;
    const tenantId = req.sessionUser!.tenantId;
    const existing = await prisma.route.findFirst({ where: { id, tenantId, deleted: true } });
    if (!existing) return res.status(404).json({ error: 'Route not found or not deleted' });
    const restored = await prisma.route.update({ where: { id }, data: { deleted: false, deletedAt: null } });
    res.json({ route: restored });
  } catch (e) {
    console.error('PATCH /routes/:id/restore error:', e);
    res.status(500).json({ error: 'Failed to restore route' });
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
        deletedAt: new Date(),
        status: 'INACTIVE'
      }
    });
    
    res.status(204).send();
  } catch (e: any) {
    console.error('DELETE /routes/:id error:', e);
    res.status(500).json({ error: 'Failed to delete route' });
  }
});

export default router;
