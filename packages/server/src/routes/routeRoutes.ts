import express, { Request, Response, RequestHandler} from 'express';
import prisma from '../db';
import asyncHandler from 'express-async-handler';
import validateRequest from '../middleware/validateRequest';
import { idValidation, routeValidation, shiftIdValidation, routeEmployeeIdValidation } from '../middleware/validation';
import { RouteBody, StopUpdate } from '../types/routeTypes';
import { checkShuttleAvailability } from '../services/shuttleAvailabilityService';
import { requireRole } from '../middleware/requireRole';
import { notificationService } from '../services/notificationService';

const router = express.Router();

/**
 * @route   GET /routes
 * @desc    Get all routes excluding deleted ones
 * @access  Public
 */
router.get(
  '/',
 requireRole(['admin', 'administrator', 'fleetManager','recruiter']),
  asyncHandler(async (_req: Request, res: Response) => {
    const routes = await prisma.route.findMany({
      where: { deleted: false },
      include: {
        shuttle: {
          include: {
            driver: true // Include driver information
          }
        },
        shift: true,
        stops: {
          include: {
            employee: true,
          },
        },
      },
    });
    res.json(routes);
  })
);

/**
 * @route   GET /routes/unique-locations
 * @desc    Get all routes with their unique employee locations
 * @access  Public
 */
router.get(
  '/unique-locations',
 requireRole(['admin', 'administrator', 'fleetManager','recruiter']),
  asyncHandler(async (_req: Request, res: Response) => {
    const routes = await prisma.route.findMany({
      include: {
        shuttle: {
          include: {
            driver: true // Include driver information
          }
        },
        shift: true,
        stops: {
          include: {
            employee: true,
          },
        },
      },
    });

    const extractUniqueLocations = (stops: any[]): string[] => {
      const locationSet = new Set<string>();
      stops.forEach((stop) => {
        if (stop.employee && stop.employee.location) {
          locationSet.add(stop.employee.location);
        }
      });
      return Array.from(locationSet);
    };

    const routesWithUniqueLocations = routes.map((route) => ({
      ...route,
      uniqueLocations: extractUniqueLocations(route.stops),
    }));

    res.json(routesWithUniqueLocations);
  })
);

/**
 * @route   GET /routes/:id
 * @desc    Get a route by ID if not deleted
 * @access  Public
 */
router.get(
  '/:id',
  idValidation,
  validateRequest,
 requireRole(['admin', 'administrator', 'fleetManager','recruiter']),
  asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id, 10);

    const route = await prisma.route.findFirst({
      where: { id, deleted: false },
      include: {
        shuttle: {
          include: {
            driver: true // Include driver information
          }
        },
        shift: true,
        stops: {
          include: {
            employee: true,
          },
        },
      },
    });

    if (!route) {
      res.status(404).json({ message: 'Route not found' });
      return;
    }

    res.json(route);
  })
);

/**
 * @route   GET /routes/shift/:shiftId
 * @desc    Get all routes for a specific shift
 * @access  Public
 */
router.get(
  '/shift/:shiftId',
  shiftIdValidation, // Reuse idValidation for shiftId
  validateRequest,
 requireRole(['admin', 'administrator', 'fleetManager','recruiter']),
  asyncHandler(async (req: Request<{ shiftId: string }>, res: Response) => {
    const shiftId = parseInt(req.params.shiftId, 10);

    try {
      const routes = await prisma.route.findMany({
        where: {
          shiftId,
          deleted: false,
        },
        include: {
          shuttle: {
            include: {
              driver: true // Include driver information
            }
          },
          shift: true,
          stops: {
            include: {
              employee: true,
            },
          },
        },
      });

      res.json(routes);
    } catch (error) {
      console.error('Error fetching routes for shift:', error);
      res.status(500).json({ error: 'Internal server error.' });
    }
  })
);

/**
 * @route   GET /routes/:routeId/stops
 * @desc    Get all stops for a specific route
 * @access  Public
 */
router.get(
  '/:routeId/stops',
  idValidation, // Reuse idValidation for routeId
  validateRequest,
 requireRole(['admin', 'administrator', 'fleetManager','recruiter']),
  asyncHandler(async (req: Request<{ routeId: string }>, res: Response) => {
    const routeId = parseInt(req.params.routeId, 10);

    try {
      const stops = await prisma.stop.findMany({
        where: {
          routeId,
        },
        include: {
          employee: true,
        },
        orderBy: {
          sequence: 'asc',
        },
      });

      res.json(stops);
    } catch (error) {
      console.error('Error fetching stops for route:', error);
      res.status(500).json({ error: 'Internal server error.' });
    }
  })
);

/**
 * @route   POST /routes
 * @desc    Create a new route using existing stops from selected employees
 * @access  Public
 */
router.post(
  '/',
  routeValidation,
  validateRequest,
 requireRole(['admin', 'administrator', 'fleetManager']),
  asyncHandler(async (req: Request<{}, {}, RouteBody>, res: Response) => {
    const {
      name,
      shuttleId,
      shiftId,
      date,
      totalDistance,
      totalTime,
      employees,
    } = req.body;

    console.log('Route creation request:', {
      name,
      shuttleId,
      shiftId,
      date,
      totalDistance,
      totalTime,
      employeesCount: employees?.length
    });

    // Validate totalTime does not exceed 90 minutes
    if (totalTime > 90) {
      res.status(400).json({ error: 'Total time of the route cannot exceed 90 minutes.' });
      return;
    }

    // Fetch the associated shift to get its endTime
    const shift = await prisma.shift.findUnique({
      where: { id: shiftId },
    });

    if (!shift) {
      res.status(404).json({ error: 'Shift not found.' });
      return;
    }

    // Calculate route startTime and endTime
    const startTime = shift.endTime;
    const endTime = new Date(startTime.getTime() + totalTime * 60000); // totalTime in minutes

    const availabilityCheck = await checkShuttleAvailability({
      shuttleId,  
      shiftId,
      proposedDate: new Date(date),
      proposedStartTime: startTime,
      proposedEndTime: endTime,
    });

    console.log('Availability check result:', availabilityCheck);

    if (!availabilityCheck.available) {
      res.status(400).json({ 
        error: 'Shuttle is not available for this time slot', 
        reason: availabilityCheck.reason 
      });
      return;
    }

    if (!employees || employees.length === 0) {
      res.status(400).json({ error: 'No employees provided for the route.' });
      return;
    }

    const employeeIds = employees.map((employee) => employee.employeeId);
    const stopIds = employees.map((employee) => employee.stopId);

    console.log('Processing employees:', { employeeIds, stopIds });

    // First check if all employees are available (not assigned)
    const employeeAvailabilityCheck = await prisma.employee.findMany({
      where: {
        id: { in: employeeIds },
        assigned: false, // Only get unassigned employees
      },
    });

    if (employeeAvailabilityCheck.length !== employeeIds.length) {
      const unavailableCount = employeeIds.length - employeeAvailabilityCheck.length;
      res.status(400).json({ 
        error: 'Some employees are already assigned to other routes',
        expected: employeeIds.length,
        available: employeeAvailabilityCheck.length,
        unavailable: unavailableCount
      });
      return;
    }

    // Verify that all provided stopIds are associated with the respective employees
    const existingStops = await prisma.stop.findMany({
      where: {
        id: { in: stopIds },
        employee: {
          id: { in: employeeIds },
          assigned: false, // Double check employee assignment
        },
        routeId: null, // Ensure stops are not already assigned to a route
      },
      include: {
        employee: true,
      },
    });

    console.log('Found existing stops:', existingStops.length);

    if (existingStops.length !== stopIds.length) {
      res.status(400).json({ 
        error: 'Some stops do not exist, are not associated with the provided employees, or are already assigned to a route.',
        expected: stopIds.length,
        found: existingStops.length
      });
      return;
    }

    try {
      // Extract employeeIds from stops
      await prisma.$transaction(async (prisma) => {
        // Create the new route
        const newRoute = await prisma.route.create({
          data: {
            name,
            shuttleId,
            shiftId,
            date: new Date(date),
            startTime,
            endTime,
            totalDistance,
            totalTime,
            status: 'active',
          },
        });

        console.log('Created new route:', newRoute.id);

        // Update stops to associate them with the new route
        await prisma.stop.updateMany({
          where: {
            id: { in: stopIds },
          },
          data: {
            routeId: newRoute.id,
            estimatedArrivalTime: new Date(),
          },
        });

        // Mark employees as assigned
        await prisma.employee.updateMany({
          where: {
            id: { in: employeeIds },
          },
          data: {
            assigned: true,
          },
        });

        // Update or create ShuttleAvailability
        await prisma.shuttleAvailability.upsert({
          where: {
            shuttleId_shiftId_date: {
              shuttleId,
              shiftId,
              date: new Date(date),
            },
          },
          create: {
            shuttleId,
            shiftId,
            date: new Date(date),
            available: false,
          },
          update: {
            available: false,
          },
        });

        // Add notification for route creation
        await notificationService.createNotification({
          toRoles: ['admin', 'administrator', 'fleetManager'],
          fromRole: 'system',
          notificationType: 'route',
          subject: 'New Route Created',
          message: `Route "${name}" has been created for shift ${shiftId} with ${employees?.length} employees`,
          importance: 'Medium',
          relatedEntityId: newRoute.id.toString()
        });

        res.status(201).json(newRoute);
      });

    } catch (error) {
      console.error('Error creating route and updating shuttle availability:', error);

      // Add notification for failed route creation
      await notificationService.createNotification({
        toRoles: ['admin', 'administrator'],
        fromRole: 'system',
        notificationType: 'route',
        subject: 'Route Creation Failed',
        message: `Failed to create route "${name}". Error: ${(error as Error).message}`,
        importance: 'High'
      });

      res.status(500).json({ 
        error: 'Internal server error.',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  })
);


/**
 * @route   PUT /routes/:id
 * @desc    Update a route by ID (without updating stops)
 * @access  Public
 */
router.put(
  '/:id',
  routeValidation,
  validateRequest,
 requireRole(['admin', 'administrator', 'fleetManager']),
  asyncHandler(async (req: Request<{ id: string }, {}, RouteBody>, res: Response) => {
    const routeId = parseInt(req.params.id, 10); // Parse routeId as an integer

    // Check if routeId is a valid number
    if (isNaN(routeId)) {
      res.status(400).json({ error: 'Invalid route ID.' });
      return;
    }
    const {
      name,
      shuttleId,
      shiftId,
      date,
      totalDistance,
      totalTime,
    } = req.body;

    // Validate totalTime does not exceed 90 minutes
    if (totalTime > 90) {
      res.status(400).json({ error: 'Total time of the route cannot exceed 90 minutes.' });
      return;
    }

    // Fetch the associated shift to get its endTime
    const shift = await prisma.shift.findUnique({
      where: { id: shiftId },
    });

    if (!shift) {
      res.status(404).json({ error: 'Shift not found.' });
      return;
    }

    // Calculate route startTime and endTime
    const startTime = shift.endTime;
    const endTime = new Date(startTime.getTime() + totalTime * 60000); // totalTime in minutes

    const availabilityCheck = await checkShuttleAvailability({
      shuttleId,  
      shiftId,
      proposedDate: new Date(date),
      proposedStartTime: startTime,
      proposedEndTime: endTime,
    });

    if (!availabilityCheck.available) {
      res.status(400).json({ 
        error: 'Shuttle is not available for this time slot', 
        reason: availabilityCheck.reason 
      });
      return;
    }

    try {
      // Update the route
      const updatedRoute = await prisma.route.update({
        where: { id: routeId },
        data: {
          name,
          shuttleId,
          shiftId,
          date: new Date(date),
          startTime,
          endTime,
          totalDistance,
          totalTime,
          status: 'active',
        },
      });

      // Update ShuttleAvailability
      await prisma.shuttleAvailability.update({
        where: {
          shuttleId_shiftId_date: {
            shuttleId,
            shiftId,
            date: new Date(date),
          },
        },
        data: {
          available: false,
          date: endTime,
        },
      });

      await notificationService.createNotification({
        toRoles: ['admin', 'administrator', 'fleetManager'],
        fromRole: 'system',
        notificationType: 'route',
        subject: 'Route Updated',
        message: `Route "${name}" has been updated with new schedule`,
        importance: 'Medium',
        relatedEntityId: routeId.toString()
      });

      res.status(200).json(updatedRoute);
    } catch (error) {
      console.error('Error updating route and shuttle availability:', error);

      await notificationService.createNotification({
        toRoles: ['admin'],
        fromRole: 'system',
        notificationType: 'route',
        subject: 'Route Update Failed',
        message: `Failed to update route ID ${routeId}. Error: ${(error as Error).message}`,
        importance: 'High'
      });

      res.status(500).json({ error: 'Internal server error.' });
    }
  })
);


/**
 * @route   PUT /routes/:routeId/stops
 * @desc    Update the stops of a route, including latitude and longitude
 * @access  Public
 */
router.put(
  '/:routeId/stops',
  idValidation, // Validate routeId
  validateRequest,
 requireRole(['admin', 'administrator', 'fleetManager']),
  asyncHandler(async (req: Request<{ routeId: string }, {}, { stops: StopUpdate[] }>, res: Response) => {
    const routeId = parseInt(req.params.routeId, 10);
    const { stops } = req.body;

    try {
      // Verify the route exists
      const route = await prisma.route.findUnique({
        where: { id: routeId },
      });

      if (!route) {
         res.status(404).json({ error: 'Route not found' });
      }

      // Extract employeeIds from stops
      const employeeIds = stops.map((stop) => stop.employeeId);

      // Fetch employees and their stops
      const employeeStops = await prisma.employee.findMany({
        where: { id: { in: employeeIds } },
        select: {
          id: true,
          stop: true,
        },
      });

      if (employeeStops.length !== employeeIds.length) {
         res.status(404).json({ error: 'One or more employees not found or do not have stops.' });
      }

      // Map employeeId to their Stop
      const employeeStopMap: Record<string, any> = {};
      employeeStops.forEach((employee) => {
        if (employee.stop) {
          employeeStopMap[employee.id] = employee.stop;
        }
      });

      // Ensure all employees have associated stops
      const allEmployeesHaveStops = employeeIds.every((id) => employeeStopMap[id]);
      if (!allEmployeesHaveStops) {
         res.status(400).json({ error: 'All selected employees must have associated stops.' });
      }

      // Begin transaction to update stops
      await prisma.$transaction(async (prisma) => {
        // Disassociate existing stops from the route
        await prisma.stop.updateMany({
          where: { routeId },
          data: {
            routeId: null,
            sequence: null,
            estimatedArrivalTime: null,
          },
        });

        // Update existing stops with new data and associate them with the route
        await Promise.all(
          stops.map((stop, index) => {
            const stopId = employeeStopMap[stop.employeeId].id;
            return prisma.stop.update({
              where: { id: stopId },
              data: {
                routeId,
                sequence: index + 1,
                estimatedArrivalTime: stop.estimatedArrivalTime ? new Date(stop.estimatedArrivalTime) : null,
                latitude: stop.latitude ?? employeeStopMap[stop.employeeId].latitude,
                longitude: stop.longitude ?? employeeStopMap[stop.employeeId].longitude,
              },
            });
          })
        );
      });

      // Fetch the updated stops
      const updatedStops = await prisma.stop.findMany({
        where: { routeId },
        include: {
          employee: true,
        },
        orderBy: {
          sequence: 'asc',
        },
      });

      res.json(updatedStops);
    } catch (error) {
      console.error('Error updating stops for route:', error);
      res.status(500).json({ error: 'Internal server error.' });
    }
  })
);

/**
 * @route   DELETE /routes/:id
 * @desc    Soft-delete a route by ID and update related records
 * @access  Public
 */
router.delete(
  '/:id',
  idValidation,
  validateRequest,
 requireRole(['admin', 'administrator', 'fleetManager']),
  asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id, 10);

    try {
      await prisma.$transaction(async (prisma) => {
        // Get the route to be deleted
        const route = await prisma.route.findUnique({
          where: { id },
          include: {
            stops: {
              include: {
                employee: true,
              },
            },
            shift: true,
            shuttle: true
          },
        });

        if (!route) {
          res.status(404).json({ error: 'Route not found' });
          return;
        }

        // Get employee IDs from the stops
        const employeeIds = route.stops
          .filter((stop): stop is typeof stop & { employee: NonNullable<typeof stop.employee> } => stop.employee !== null)
          .map(stop => stop.employee.id);

        // Mark employees as unassigned
        if (employeeIds.length > 0) {
          await prisma.employee.updateMany({
            where: {
              id: { in: employeeIds },
            },
            data: {
              assigned: false,
            },
          });
        }

        // Update shuttle availability to available
        await prisma.shuttleAvailability.updateMany({
          where: {
            shuttleId: route.shuttleId,
            shiftId: route.shiftId,
            date: route.date,
          },
          data: {
            available: true,
          },
        });

        // Disassociate stops from the route
        await prisma.stop.updateMany({
          where: {
            routeId: id,
          },
          data: {
            routeId: null,
            sequence: null,
            estimatedArrivalTime: null,
          },
        });

        // Soft delete the route
        await prisma.route.update({
          where: { id },
          data: {
            deleted: true,
            deletedAt: new Date(),
            status: 'inactive',
          },
        });

        await notificationService.createNotification({
          toRoles: ['admin', 'administrator', 'fleetManager'],
          fromRole: 'system',
          notificationType: 'route',
          subject: 'Route Deleted',
          message: `Route "${route.name}" has been deleted. ${route.stops.length} employees unassigned.`,
          importance: 'High',
          relatedEntityId: id.toString()
        });
      });

      res.status(204).send();
    } catch (error) {
      console.error('Error soft-deleting route:', error);

      await notificationService.createNotification({
        toRoles: ['admin'],
        fromRole: 'system',
        notificationType: 'route',
        subject: 'Route Deletion Failed',
        message: `Failed to delete route ID ${id}. Error: ${(error as Error).message}`,
        importance: 'High'
      });

      res.status(500).json({ error: 'Internal server error.' });
    }
  })
);

/**
 * @route   PATCH /routes/:id/restore
 * @desc    Restore a soft-deleted route
 * @access  Public
 */
router.patch(
  '/:id/restore',
  idValidation,
  validateRequest,
 requireRole(['admin', 'administrator', 'fleetManager']),
  asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id, 10);

    try {
      const restoredRoute = await prisma.route.update({
        where: { id },
        data: {
          deleted: false,
          deletedAt: null,
        },
      });

      res.json(restoredRoute);
    } catch (error) {
      console.error('Error restoring route:', error);
      res.status(500).json({ error: 'Internal server error.' });
    }
  })
);

router.patch(
  '/:id/status/:status',
 requireRole(['admin', 'administrator', 'fleetManager']),
  asyncHandler(async (req: Request<{ id: string; status: string }>, res: Response) => {
    const {id, status} = req.params;
    const routeId = parseInt(id, 10);
    if (!['active', 'inactive', 'canceled'].includes(status)) {
      res.status(400).json({ error: 'Unsupported status value' });
    }
    
    const existingRoute = await prisma.route.findUnique({
      where: { id: routeId },
      include: {
        shuttle: true
      }
    });
    if (!existingRoute) {
        res.status(404).json({ error: 'Route not found' });
        return;
    }

    await notificationService.createNotification({
      toRoles: ['admin', 'administrator', 'fleetManager'],
      fromRole: 'system',
      notificationType: 'route',
      subject: 'Route Status Changed',
      message: `Route "${existingRoute.name}" status changed to ${status.toUpperCase()}`,
      importance: status === 'canceled' ? 'High' : 'Medium',
      relatedEntityId: routeId.toString()
    });
  }

  )
);


router.patch(
  '/:routeId/stops/:stopId/remove',
  ...[idValidation, validateRequest],
 requireRole(['admin', 'administrator', 'fleetManager']),
  asyncHandler(async (req: Request<{ routeId: string; stopId: string }>, res: Response) => {
    const routeId = parseInt(req.params.routeId, 10);
    const stopId = parseInt(req.params.stopId, 10);

    // Check if the route exists
    const route = await prisma.route.findUnique({ where: { id: routeId } });
    if (!route) {
      res.status(404).json({ error: 'Route not found' });
      return;
    }

    // Check if the stop exists and belongs to the route
    const stop = await prisma.stop.findUnique({ where: { id: stopId } });
    if (!stop || stop.routeId !== routeId) {
      res.status(404).json({ error: 'Stop not found in the specified route' });
      return;
    }

    // Remove the stop from the route
    await prisma.stop.update({
      where: { id: stopId },
      data: {
        routeId: null,
        sequence: null,
        estimatedArrivalTime: null,
      },
    });

    // Update shuttle's capacity
    // await prisma.shuttle.update({
    //   where: { id: route.shuttleId },
    //   data: {
    //     capacity: {
    //       increment: 1
    //     }
    //   }
    // });

    res.status(200).json({ message: 'Stop removed from route successfully and shuttle capacity updated' });
  })
);

router.patch(
  '/:routeId/stops/:stopId/add',
  ...[idValidation, validateRequest],
 requireRole(['admin', 'administrator', 'fleetManager']),
  asyncHandler(async (req: Request<{ routeId: string; stopId: string }>, res: Response) => {
    const routeId = parseInt(req.params.routeId, 10);
    const stopId = parseInt(req.params.stopId, 10);

    // Check if the route exists
    const route = await prisma.route.findUnique({ where: { id: routeId } });
    if (!route) {
      res.status(404).json({ error: 'Route not found' });
      return;
    }

    // Check if the stop exists and is not already assigned to another route
    const stop = await prisma.stop.findUnique({ where: { id: stopId } });
    if (!stop || stop.routeId) {
      res.status(404).json({ error: 'Stop not found or already assigned to another route' });
      return;
    }

    // Add the stop to the route
    await prisma.stop.update({
      where: { id: stopId },
      data: {
        routeId: routeId,
        sequence: (await prisma.stop.count({ where: { routeId } })) + 1,
        estimatedArrivalTime: new Date(), // Adjust as needed
      },
    });

    // Update shuttle's capacity
    await prisma.shuttle.update({
      where: { id: route.shuttleId },
      data: {
        capacity: {
          decrement: 1
        }
      }
    });

    res.status(200).json({ message: 'Stop added to route successfully and shuttle capacity updated' });
  })
);

router.patch(
  '/:routeId/employees/:employeeId/add-stop',
  ...[routeEmployeeIdValidation, validateRequest],
 requireRole(['admin', 'administrator', 'fleetManager']),
  asyncHandler(async (req: Request<{ routeId: string; employeeId: string }>, res: Response) => {
    const routeId = parseInt(req.params.routeId, 10);
    const employeeId = req.params.employeeId;
    const { totalDistance, totalTime } = req.body;

    // Get route with shuttle info and current stops
    const route = await prisma.route.findUnique({ 
      where: { id: routeId },
      include: {
        shuttle: true,
        stops: true
      }
    });

    if (!route) {
      res.status(404).json({ error: 'Route not found' });
      return;
    }

    // Check capacity
    if (route.stops.length >= route.shuttle.capacity) {
      res.status(400).json({ error: 'Route has reached maximum shuttle capacity' });
      return;
    }

    // Check if the employee exists
    const employee = await prisma.employee.findUnique({ where: { id: employeeId } });
    if (!employee) {
      res.status(404).json({ error: 'Employee not found' });
      return;
    }

    // Check if the employee's stop exists and is not already assigned to another route
    const stop = await prisma.stop.findUnique({ where: { id: employee.stopId } });
    if (!stop || stop.routeId) {
      res.status(404).json({ error: 'Stop not found or already assigned to another route' });
      return;
    }

    await prisma.stop.update({
      where: { id: stop.id },
      data: {
        routeId: routeId,
        sequence: (await prisma.stop.count({ where: { routeId } })) + 1,
        estimatedArrivalTime: new Date(),
      },
    });

    await prisma.route.update({
      where: { id: routeId },
      data: {
        totalDistance,
        totalTime
      }
    });

    await prisma.employee.update({
      where: { id: employeeId },
      data: {
        assigned: true
      }
    });

    res.status(200).json({ message: 'Stop added to route successfully' });
  })
);

router.patch(
  '/:routeId/employees/:employeeId/remove-stop',
  ...[routeEmployeeIdValidation, validateRequest],
 requireRole(['admin', 'administrator', 'fleetManager']),
  asyncHandler(async (req: Request<{ routeId: string; employeeId: string }>, res: Response) => {
    const routeId = parseInt(req.params.routeId, 10);
    const employeeId = req.params.employeeId;
    const { totalDistance, totalTime } = req.body;

    // Check if the route exists
    const route = await prisma.route.findUnique({ 
      where: { id: routeId },
      include: {
        shuttle: true,
        stops: true
      }
    });
    if (!route) {
      res.status(404).json({ error: 'Route not found' });
      return;
    }

    // Check if the employee exists
    const employee = await prisma.employee.findUnique({ where: { id: employeeId } });
    if (!employee) {
      res.status(404).json({ error: 'Employee not found' });
      return;
    }

    // Check if the employee's stop exists and belongs to the route
    const stop = await prisma.stop.findUnique({ where: { id: employee.stopId } });
    if (!stop || stop.routeId !== routeId) {
      res.status(404).json({ error: 'Stop not found in the specified route' });
      return;
    }

    try {
      await prisma.$transaction(async (prisma) => {
        // Remove the stop from the route
        await prisma.stop.update({
          where: { id: stop.id },
          data: {
            routeId: null,
            sequence: null,
            estimatedArrivalTime: null,
          },
        });

        // Update route metrics
        await prisma.route.update({
          where: { id: routeId },
          data: {
            totalDistance: parseFloat(totalDistance.toFixed(2)),
            totalTime: Math.round(totalTime)
          }
        });

        // Update employee's assigned status
        await prisma.employee.update({
          where: { id: employeeId },
          data: {
            assigned: false
          }
        });
      });

      res.status(200).json({ 
        message: 'Stop removed and route metrics updated successfully',
        totalDistance,
        totalTime
      });
    } catch (error) {
      console.error('Error in transaction:', error);
      throw error;
    }
  })
);

export default router;