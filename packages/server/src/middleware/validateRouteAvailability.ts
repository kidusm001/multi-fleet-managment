import { Request, Response, NextFunction } from 'express';
import { VehicleAvailabilityService } from '../services/vehicleAvailabilityService';

const availabilityService = new VehicleAvailabilityService();

export const validateRouteAvailability = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { shuttleId, startTime, endTime } = req.body;
    const routeId = req.params.id ? parseInt(req.params.id, 10) : undefined;

    // Validate the route time window
  // For now, just ensure shift exists via getAvailableShuttles; replace when service implements time window validation
  await VehicleAvailabilityService.getAvailableVehicles({ shiftId: String(req.body.shiftId || '') });
    next();
  } catch (error) {
    console.error('Error validating route availability:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
