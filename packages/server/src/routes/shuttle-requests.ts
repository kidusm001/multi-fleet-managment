import express from 'express';
import { PrismaClient, NotificationType, ImportanceLevel } from '@prisma/client';
import { requireAuth } from '../middleware/auth';
import { fromNodeHeaders } from 'better-auth/node';
import { auth } from '../lib/auth';
import { broadcastNotification } from '../lib/notificationBroadcaster';

const router = express.Router();
const prisma = new PrismaClient();

// Get my shuttle requests (for employees)
router.get('/my-requests', requireAuth, async (req, res) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const activeOrgId: string | null | undefined = req.session?.session?.activeOrganizationId;
    if (!activeOrgId) {
      return res.status(400).json({ error: 'Organization context required' });
    }

    const requests = await prisma.shuttleRequest.findMany({
      where: {
        employee: {
          userId
        },
        organizationId: activeOrgId
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
router.post('/', requireAuth, async (req, res) => {
  try {
    const userId = req.user?.id;
    const activeOrgId: string | null | undefined = req.session?.session?.activeOrganizationId;
    
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!activeOrgId) {
      return res.status(400).json({ error: 'Organization context required' });
    }

    const { date, shiftId, pickupLocation, notes } = req.body;

    // Find employee record with shift and work location
    const employee = await prisma.employee.findFirst({
      where: {
        userId,
        organizationId: activeOrgId
      },
      include: {
        shift: true,
        workLocation: true
      }
    });

    if (!employee) {
      return res.status(404).json({ error: 'Employee record not found' });
    }

    // Use provided values or default to employee's data
    const finalShiftId = shiftId || employee.shiftId;
    const finalPickupLocation = pickupLocation || employee.workLocation?.address || employee.location;

    // Check if employee already has a request for this date
    const existingRequest = await prisma.shuttleRequest.findFirst({
      where: {
        employeeId: employee.id,
        date: new Date(date),
        status: {
          in: ['PENDING', 'APPROVED']
        }
      }
    });

    if (existingRequest) {
      return res.status(409).json({ error: 'You already have a shuttle request for this date' });
    }

    // Create shuttle request
    const shuttleRequest = await prisma.shuttleRequest.create({
      data: {
        employeeId: employee.id,
        date: new Date(date),
        shiftId: finalShiftId,
        pickupLocation: finalPickupLocation,
        notes: notes || null,
        status: 'PENDING',
        organizationId: activeOrgId,
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

    // Broadcast notification to admins, owners, and managers
    await broadcastNotification({
      organizationId: activeOrgId,
      title: 'New Shuttle Request',
      message: `${shuttleRequest.employee.user.name} requested shuttle service for ${new Date(date).toLocaleDateString()}`,
      type: NotificationType.REQUEST_CREATED,
      importance: ImportanceLevel.MEDIUM,
      toRoles: ['admin', 'owner', 'manager'],
      fromRole: 'employee',
      relatedEntityId: shuttleRequest.id,
      actionUrl: `/shuttle-requests/${shuttleRequest.id}`,
      metadata: {
        requestId: shuttleRequest.id,
        employeeId: employee.id,
        employeeName: shuttleRequest.employee.user.name,
        date: date,
        shiftId: finalShiftId,
        pickupLocation: finalPickupLocation
      }
    });

    res.json({ success: true, data: shuttleRequest });
  } catch (error) {
    console.error('Error creating shuttle request:', error);
    res.status(500).json({ error: 'Failed to create shuttle request' });
  }
});

// Update shuttle request status (admin/owner/manager only)
router.patch('/:id/status', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const activeOrgId: string | null | undefined = req.session?.session?.activeOrganizationId;

    if (!activeOrgId) {
      return res.status(400).json({ error: 'Organization context required' });
    }

    // Check permissions - allow admin, owner, and manager roles
    const userRole = req.user?.role;
    if (!userRole || !['admin', 'owner', 'manager'].includes(userRole)) {
      return res.status(403).json({ error: 'Unauthorized - Admin, Owner, or Manager access required' });
    }

    // Validate status
    if (!['PENDING', 'APPROVED', 'REJECTED'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const updated = await prisma.shuttleRequest.update({
      where: {
        id,
        organizationId: activeOrgId
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
            userId: true,
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

    // Notify the employee about status change
    const notificationType = status === 'APPROVED' 
      ? NotificationType.REQUEST_APPROVED 
      : status === 'REJECTED'
      ? NotificationType.REQUEST_REJECTED
      : NotificationType.REQUEST_PENDING;

    const importance = status === 'APPROVED'
      ? ImportanceLevel.HIGH
      : status === 'REJECTED'
      ? ImportanceLevel.MEDIUM
      : ImportanceLevel.LOW;

    await broadcastNotification({
      organizationId: activeOrgId,
      title: `Shuttle Request ${status}`,
      message: `Your shuttle request for ${new Date(updated.date).toLocaleDateString()} has been ${status.toLowerCase()}`,
      type: notificationType,
      importance: importance,
      toRoles: ['employee'],
      toUserId: updated.employee.userId,
      fromRole: userRole || 'manager',
      relatedEntityId: updated.id,
      actionUrl: `/shuttle-requests/${updated.id}`,
      metadata: {
        requestId: updated.id,
        status: status,
        date: updated.date
      }
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('Error updating shuttle request status:', error);
    res.status(500).json({ error: 'Failed to update shuttle request status' });
  }
});

// Get all shuttle requests (admin/owner/manager only)
router.get('/', requireAuth, async (req, res) => {
  try {
    const activeOrgId: string | null | undefined = req.session?.session?.activeOrganizationId;

    if (!activeOrgId) {
      return res.status(400).json({ error: 'Organization context required' });
    }

    const requests = await prisma.shuttleRequest.findMany({
      where: {
        organizationId: activeOrgId
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
