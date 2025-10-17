import { z } from 'zod';

// Define route status enum that matches Prisma schema
const RouteStatusEnum = z.enum(['PENDING', 'ACTIVE', 'IN_PROGRESS', 'COMPLETED', 'INACTIVE', 'CANCELLED']);

// Base Route schema for validation
const BaseRouteSchema = z.object({
    name: z.string().min(1, 'Route name is required').max(255, 'Route name must be less than 255 characters'),
    description: z.string().max(1000, 'Description must be less than 1000 characters').optional().nullable(),
    locationId: z.cuid('Location ID must be a valid CUID'),
    sourceId: z.cuid('Source ID must be a valid CUID').optional().nullable(),
    vehicleId: z.cuid('Vehicle ID must be a valid CUID').optional().nullable(),
    shiftId: z.cuid('Shift ID must be a valid CUID').optional().nullable(),
    date: z.iso.datetime('Invalid date format').optional().nullable(),
    startTime: z.iso.datetime('Invalid start time format').optional().nullable(),
    endTime: z.iso.datetime('Invalid end time format').optional().nullable(),
    totalDistance: z.number().min(0, 'Total distance must be non-negative').optional().nullable(),
    totalTime: z.number().min(0, 'Total time must be non-negative').max(180, 'Total time cannot exceed 180 minutes').optional().nullable(),
    status: RouteStatusEnum.optional(),
    isActive: z.boolean().optional(),
});

// Create Route schema
export const CreateRouteSchema = BaseRouteSchema.extend({
    employees: z.array(z.object({
        employeeId: z.cuid('Employee ID must be a valid CUID'),
        stopId: z.cuid('Stop ID must be a valid CUID'),
    })).min(1, 'At least one employee is required'),
}).required({
    name: true,
    locationId: true,
    shiftId: true,
    date: true,
    totalTime: true,
    vehicleId: true,
});

// Update Route schema (all fields optional except constraints)
export const UpdateRouteSchema = BaseRouteSchema.partial().superRefine((data, ctx) => {
    // If locationId is provided, it must be a valid CUID (not null/undefined)
    if (data.locationId !== undefined && (data.locationId === null || data.locationId.length === 0)) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Location ID must be provided and cannot be null',
            path: ['locationId']
        });
    }

    if (data.sourceId !== undefined && (data.sourceId === null || data.sourceId.length === 0)) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Source ID must be provided and cannot be null',
            path: ['sourceId']
        });
    }
});

// Route ID parameter schema
export const RouteIdParamSchema = z.object({
    id: z.cuid('Route ID must be a valid CUID'),
});

// Route status update schema
export const UpdateRouteStatusSchema = z.object({
    status: RouteStatusEnum,
});

// Employee assignment schemas for routes
export const RouteEmployeeSchema = z.object({
    employeeId: z.cuid('Employee ID must be a valid CUID'),
    stopId: z.cuid('Stop ID must be a valid CUID'),
});

export const RouteEmployeesSchema = z.object({
    employees: z.array(RouteEmployeeSchema).min(1, 'At least one employee is required'),
    totalDistance: z.number().min(0, 'Total distance must be non-negative').optional(),
    totalTime: z.number().min(0, 'Total time must be non-negative').max(180, 'Total time cannot exceed 180 minutes').optional(),
});

// Route stop management schemas
export const AddStopToRouteSchema = z.object({
    stopId: z.cuid('Stop ID must be a valid CUID'),
    sequence: z.number().int().min(0, 'Sequence must be a non-negative integer').optional(),
    estimatedArrivalTime: z.string().datetime('Invalid estimated arrival time format').optional(),
});

export const UpdateRouteStopsSchema = z.object({
    stops: z.array(z.object({
        stopId: z.cuid('Stop ID must be a valid CUID'),
        sequence: z.number().int().min(0, 'Sequence must be a non-negative integer'),
        estimatedArrivalTime: z.iso.datetime('Invalid estimated arrival time format').optional(),
    })).min(1, 'At least one stop is required'),
});

// Query parameter schemas
export const RoutesByShiftParamSchema = z.object({
    shiftId: z.cuid('Shift ID must be a valid CUID'),
});

export const RoutesByVehicleParamSchema = z.object({
    vehicleId: z.cuid('Vehicle ID must be a valid CUID'),
});

export const RoutesByLocationParamSchema = z.object({
    locationId: z.cuid('Location ID must be a valid CUID'),
});

export const RouteEmployeeParamSchema = z.object({
    routeId: z.cuid('Route ID must be a valid CUID'),
    employeeId: z.cuid('Employee ID must be a valid CUID'),
});

// Export types for TypeScript
export type CreateRouteInput = z.infer<typeof CreateRouteSchema>;
export type UpdateRouteInput = z.infer<typeof UpdateRouteSchema>;
export type UpdateRouteStatusInput = z.infer<typeof UpdateRouteStatusSchema>;
export type RouteEmployeesInput = z.infer<typeof RouteEmployeesSchema>;
export type AddStopToRouteInput = z.infer<typeof AddStopToRouteSchema>;
export type UpdateRouteStopsInput = z.infer<typeof UpdateRouteStopsSchema>;
