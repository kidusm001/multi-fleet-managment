import { body, param, ValidationChain } from 'express-validator';

// Common validation chains
export const idValidation: ValidationChain[] = [
  param('id').trim().notEmpty().withMessage('Valid ID is required')
];

// Vehicle Category validation
export const vehicleCategoryValidation: ValidationChain[] = [
  body('name').trim().notEmpty().withMessage('Category name is required'),
  body('capacity')
    .isInt({ gt: 0 })
    .withMessage('Capacity must be a positive integer')
];

// Shift ID validation
export const shiftIdValidation: ValidationChain[]= [
  param('shiftId').trim().notEmpty().withMessage('Valid shift ID is required')
];

export const routeEmployeeIdValidation : ValidationChain[] = [
  param('routeId').trim().notEmpty().withMessage('Valid route ID is required'),
  param('employeeId').trim().notEmpty().withMessage('Valid employee ID is required')
];

// Vehicle validation
export const vehicleValidation: ValidationChain[] = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('licensePlate').trim().notEmpty().withMessage('License plate is required'),
  body('categoryId').isInt().withMessage('Valid category ID is required'),
  body('dailyRate').isFloat({ min: 0 }).withMessage('Daily rate must be positive')
];

// Shift validation
export const shiftValidation: ValidationChain[]= [
  body('name').trim().notEmpty().withMessage('Shift name is required').isLength({ max: 100 }).withMessage('Shift name must not exceed 100 characters'),
  
  body('startTime').notEmpty().withMessage('Start time is required').isISO8601().withMessage('Start time must be a valid ISO 8601 date'),
  
  body('endTime').notEmpty().withMessage('End time is required').isISO8601().withMessage('End time must be a valid ISO 8601 date')
    .custom((endTime, { req }) => {
      if (new Date(endTime) <= new Date(req.body.startTime)) {
        throw new Error('End time must be after start time');
      }
      return true;
    }),
  
  body('timeZone') .trim() .notEmpty() .withMessage('Time zone is required') .isString() .withMessage('Time zone must be a valid string'),
];

//Employee ID validation
export const employeeIdValidation: ValidationChain[] = [
  param('id')
    .trim()
    .notEmpty()
    .withMessage('Valid employee ID is required'),
];

// Employee validation
export const employeeValidation: ValidationChain[] = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('location').trim().notEmpty().withMessage('Location is required'),
  body('departmentId').trim().notEmpty().withMessage('Valid department ID is required'),
  body('shiftId').trim().notEmpty().withMessage('Valid shift ID is required'),
  body('latitude').isFloat().withMessage('Valid latitude is required'),
  body('longitude').isFloat().withMessage('Valid longitude is required')
];

// Route validation
export const routeValidation: ValidationChain[] = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('shuttleId').trim().notEmpty().withMessage('Valid vehicle ID is required'),
  body('shiftId').trim().notEmpty().withMessage('Valid shift ID is required'),
  body('date').isISO8601().withMessage('Valid date is required'),
  body('totalDistance').isFloat({ min: 0 }).withMessage('Total distance must be positive'),
  body('totalTime').isFloat({ min: 0 }).withMessage('Total time must be positive'),
  body('employees').isArray().withMessage('Employees must be an array'),
  body('employees.*.employeeId').trim().notEmpty().withMessage('Valid employeeId is required'),
  body('employees.*.stopId').trim().notEmpty().withMessage('Valid stopId is required')
];

// Cluster validation
export const clusterValidation: ValidationChain[] = [
  body('shiftId').trim().notEmpty().withMessage('Valid shift ID is required'),
  body('date').isISO8601().withMessage('Valid date is required')
];

// Vehicle availability validation
export const vehicleAvailabilityValidation: ValidationChain[] = [
  param('shuttleId').trim().notEmpty().withMessage('Valid vehicle ID is required'),
  param('shiftId').trim().notEmpty().withMessage('Valid shift ID is required'),
  body('date').isISO8601().withMessage('Valid date is required')
];

// Specific vehicle cluster validation
export const specificVehicleClusterValidation: ValidationChain[] = [
  param('shiftId').trim().notEmpty().withMessage('Shift ID is required'),
  param('shuttleId').trim().notEmpty().withMessage('Vehicle ID is required'),
  body('date')
    .exists()
    .withMessage('Date is required')
    .custom((value) => {
      const date = new Date(value);
      if (isNaN(date.getTime())) {
        throw new Error('Invalid date format');
      }
      // Accept any valid ISO date string
      return true;
    })
]; 