import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// Get my shuttle requests (for employees)
router.get('/my-requests', async (req, res) => {
  try {
    const userId = (req as any).user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const requests = await prisma.shuttleRequest.findMany({
      where: {
        employee: {
          userId
        }
      },
      include: {
        shift: {
          select: {
            id: true,
            name: true,
            startTime: true,
            endTime: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({ data: requests });
  } catch (error) {
    console.error('Error fetching shuttle requests:', error);
    res.status(500).json({ error: 'Failed to fetch shuttle requests' });
  }
});

// Create shuttle request
router.post('/', async (req, res) => {
  try {
    const userId = (req as any).user?.id;
    const organizationId = (req as any).organizationId;
    
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!organizationId) {
      return res.status(400).json({ error: 'Organization context required' });
    }

    const { date, shiftId, pickupLocation, notes } = req.body;

    // Validate required fields
    if (!date || !shiftId || !pickupLocation) {
      return res.status(400).json({ 
        error: 'Missing required fields: date, shiftId, and pickupLocation are required' 
      });
    }

    // Find employee record
    const employee = await prisma.employee.findFirst({
      where: {
        userId,
        organizationId
      }
    });

    if (!employee) {
      return res.status(404).json({ error: 'Employee record not found' });
    }

    // Create shuttle request
    const shuttleRequest = await prisma.shuttleRequest.create({
      data: {
        employeeId: employee.id,
        date: new Date(date),
        shiftId,
        pickupLocation,
        notes: notes || null,
        status: 'PENDING',
        organizationId
      },
      include: {
        shift: {
          select: {
            id: true,
            name: true,
            startTime: true,
            endTime: true
          }
        }
      }
    });

    res.json({ success: true, data: shuttleRequest });
  } catch (error) {
    console.error('Error creating shuttle request:', error);
    res.status(500).json({ error: 'Failed to create shuttle request' });
  }
});

// Update shuttle request status (admin only)
router.patch('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const organizationId = (req as any).organizationId;

    if (!organizationId) {
      return res.status(400).json({ error: 'Organization context required' });
    }

    // Validate status
    if (!['PENDING', 'APPROVED', 'REJECTED'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const updated = await prisma.shuttleRequest.update({
      where: {
        id,
        organizationId
      },
      data: {
        status
      },
      include: {
        shift: {
          select: {
            id: true,
            name: true,
            startTime: true,
            endTime: true
          }
        },
        employee: {
          select: {
            id: true,
            user: {
              select: {
                name: true,
                email: true
              }
            }
          }
        }
      }
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('Error updating shuttle request status:', error);
    res.status(500).json({ error: 'Failed to update shuttle request status' });
  }
});

// Get all shuttle requests (admin only)
router.get('/', async (req, res) => {
  try {
    const organizationId = (req as any).organizationId;

    if (!organizationId) {
      return res.status(400).json({ error: 'Organization context required' });
    }

    const requests = await prisma.shuttleRequest.findMany({
      where: {
        organizationId
      },
      include: {
        shift: {
          select: {
            id: true,
            name: true,
            startTime: true,
            endTime: true
          }
        },
        employee: {
          select: {
            id: true,
            user: {
              select: {
                name: true,
                email: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({ data: requests });
  } catch (error) {
    console.error('Error fetching shuttle requests:', error);
    res.status(500).json({ error: 'Failed to fetch shuttle requests' });
  }
});

export default router;
