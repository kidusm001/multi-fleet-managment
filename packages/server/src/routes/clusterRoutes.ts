import express, { Response, Request, NextFunction } from 'express';
import asyncHandler from 'express-async-handler';
import prisma from '../db';
import axios from 'axios';
import  validateRequest  from '../middleware/validateRequest';
import { clusterValidation, availabilityValidation, specificShuttleClusterValidation } from '../middleware/validation';
import { ClusterParams, ClusterBody, TypedRequest, ClusteringBody, ClusteringBodyFastApi } from '../types/routeTypes';
import { clusteringService } from '../services/clusteringService';
import { requireRole } from '../middleware/requireRole';

const router = express.Router();

router.get('/', (_req: Request, res: Response) => {
  res.status(200).json({ message: 'Cluster routes are working' });
})


/**
 * @route   POST /clustering
 * @desc    Create a new route using existing stops from selected employees
 * @access  Public
 */

// router.post('/clustering', requireRole(['admin', 'administrator', 'fleetManager']), asyncHandler(async (req: TypedRequest<{},ClusteringBody>, res: Response) => {
//   const { employees, shuttles } = req.body;
//   const FASTAPI_URL = process.env.FASTAPI_URL || 'http://localhost:8000';

//   try {
//     const response = await axios.post(`${FASTAPI_URL}/clustering`, {
//       locations: {
//         HQ: [38.768504565538684, 9.016317042558217],
//         employees,
//       },
//       shuttles,
//     });
//     res.json(response.data);
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ error: 'Error calling clustering service' });
//   }
// }));
router.post('/clustering', requireRole([ 'administrator', 'fleetManager']), asyncHandler(async (req: TypedRequest<{},ClusteringBody>, res: Response) => {
  const { employees, shuttles } = req.body;
  const FASTAPI_URL = process.env.FASTAPI_URL || 'http://localhost:8000';

  // Make sure the session cookie is available from the request.
  // For example, if Better Auth set the cookie as "my-app.session_token", read it from req.cookies:
  const sessionCookie = req.cookies["better-auth.session_token"];
  if (!sessionCookie) {
    res.status(401).json({ error: 'No session token provided.' });
    return;
  }

  try {
    const response = await axios.post(`${FASTAPI_URL}/clustering`, {
      locations: {
        HQ: [38.768504565538684, 9.016317042558217],
        employees,
      },
      shuttles,
    }, {
      headers: {
        // Forward the cookie header to FastAPI
        Cookie: `better-auth.session_token=${sessionCookie}`,
      },
    });
    res.json(response.data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error calling clustering service' });
  }
}));

// Get optimal clusters for a shift
router.post(
  '/optimize',
  clusterValidation,
  validateRequest,
  asyncHandler(async (req: TypedRequest<{}, ClusterBody>, res: Response) => {
    const { shiftId, date } = req.body;

    if (!shiftId) {
      res.status(400).json({ error: 'Shift ID is required' });
      return;
    }

    // Get available shuttles for the shift
    const availableShuttles = await prisma.shuttle.findMany({
      where: {
        deleted: false,
      },
      include: {
        category: true,
        availability: {
          where: {
            shiftId,
            date: new Date(date),
            available: true
          }
        }
      }
    });

    // Filter shuttles that have availability
    const shuttlesWithAvailability = availableShuttles.filter(
      shuttle => shuttle.availability.length > 0
    );

    const clusters = await clusteringService.getOptimalClusters(
      String(shiftId),
      new Date(date),
      shuttlesWithAvailability.map(s => ({
        id: s.id,
        capacity: s.category?.capacity || 0
      }))
    );

    res.json(clusters);
  })
);

// Get optimal cluster for specific shuttle
router.post(
  '/shift/:shiftId/shuttle/:shuttleId',
  (req: Request, res: Response, next: NextFunction) => {
    console.log('Request params:', req.params);
    console.log('Request body:', req.body);
    console.log('Request headers:', req.headers);
    next();
  },
  specificShuttleClusterValidation,
  validateRequest,
  asyncHandler(async (req: TypedRequest<{ shiftId: string; shuttleId: string }, { date: string }>, res: Response) => {
    const { shiftId, shuttleId } = req.params;
    const { date } = req.body;

    console.log('Processing request with:', { shiftId, shuttleId, date });

    if (!shiftId || !shuttleId) {
      console.log('Missing required params:', { shiftId, shuttleId });
      res.status(400).json({ error: 'Shift ID and Shuttle ID are required' });
      return;
    }

    // Parse the date string to a Date object
    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      console.log('Invalid date format:', date);
      res.status(400).json({ error: 'Invalid date format' });
      return;
    }

    try {
      // Check if shuttle exists
      const shuttle = await prisma.shuttle.findUnique({
        where: { id: parseInt(shuttleId) }
      });

      if (!shuttle) {
        console.log('Shuttle not found:', shuttleId);
        res.status(404).json({ error: 'Shuttle not found' });
        return;
      }

      // Check if shift exists
      const shift = await prisma.shift.findUnique({
        where: { id: parseInt(shiftId) }
      });

      if (!shift) {
        console.log('Shift not found:', shiftId);
        res.status(404).json({ error: 'Shift not found' });
        return;
      }

      // Check if shuttle is available for the shift
      const isAvailable = await prisma.shuttleAvailability.findFirst({
        where: {
          shuttleId: parseInt(shuttleId),
          shiftId: parseInt(shiftId),
          date: parsedDate,
          available: true
        }
      });

      console.log('Availability check result:', isAvailable);

      if (!isAvailable) {
        res.status(400).json({ error: 'Shuttle is not available for this shift' });
        return;
      }

      const cluster = await clusteringService.getOptimalClusterForShuttle(
        shiftId,
        parsedDate,
        parseInt(shuttleId)
      );

      console.log('Cluster result:', cluster);

      if (!cluster) {
        res.status(404).json({ error: 'Failed to generate cluster' });
        return;
      }

      res.json(cluster);
    } catch (error: any) {
      console.error('Error processing request:', error);
      res.status(500).json({ 
        error: 'Internal server error', 
        details: error?.message || 'Unknown error occurred'
      });
    }
  })
);

// Check shuttle availability for a shift
router.post(
  '/availability/:shuttleId/:shiftId',
  availabilityValidation,
  validateRequest,
  asyncHandler(async (req: TypedRequest<{ shuttleId: string; shiftId: string }, { date: string }>, res: Response) => {
    const { shuttleId, shiftId } = req.params;
    const { date } = req.body;

    if (!shuttleId || !shiftId) {
      res.status(400).json({ error: 'Shuttle ID and Shift ID are required' });
      return;
    }

    const availability = await prisma.shuttleAvailability.findFirst({
      where: {
        shuttleId: parseInt(shuttleId),
        shiftId: parseInt(shiftId),
        date: new Date(date)
      },
      include: {
        shuttle: {
          include: {
            category: true
          }
        },
        shift: true
      }
    });

    if (!availability) {
      // Check if there are any conflicting routes
      const shift = await prisma.shift.findUnique({
        where: { id: parseInt(shiftId) }
      });

      if (!shift) {
        res.status(404).json({ error: 'Shift not found' });
        return;
      }

      const conflictingRoute = await prisma.route.findFirst({
        where: {
          shuttleId: parseInt(shuttleId),
          date: new Date(date),
          OR: [
            {
              startTime: {
                lte: shift.endTime,
                gte: shift.startTime
              }
            },
            {
              endTime: {
                lte: shift.endTime,
                gte: shift.startTime
              }
            }
          ]
        }
      });

      // If no conflicting route, shuttle is available
      const isAvailable = !conflictingRoute;

      // Create availability record
      const newAvailability = await prisma.shuttleAvailability.create({
        data: {
          shuttleId: parseInt(shuttleId),
          shiftId: parseInt(shiftId),
          date: new Date(date),
          available: isAvailable
        },
        include: {
          shuttle: {
            include: {
              category: true
            }
          },
          shift: true
        }
      });

      res.json(newAvailability);
    } else {
      res.json(availability);
    }
  })
);

export default router;