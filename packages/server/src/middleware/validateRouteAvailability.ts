import { Request, Response, NextFunction } from 'express';
import { ShuttleAvailabilityService } from '../services/shuttleAvailabilityService';

const availabilityService = new ShuttleAvailabilityService();

export const validateRouteAvailability = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { shuttleId, startTime, endTime } = req.body;
    const routeId = req.params.id ? parseInt(req.params.id, 10) : undefined;

    // Validate the route time window
    const validation = await availabilityService.validateRouteTimeWindow(
      shuttleId,
      new Date(startTime),
      new Date(endTime),
      routeId
    );

    if (!validation.valid) {
      res.status(400).json({ error: validation.message });
      return;
    }

    // Add service to request for use in route handlers
    req.availabilityService = availabilityService;
    next();
  } catch (error) {
    console.error('Error validating route availability:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
