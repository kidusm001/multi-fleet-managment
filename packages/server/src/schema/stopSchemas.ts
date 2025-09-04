import { z } from 'zod';

// Base Stop schema for validation
const BaseStopSchema = z.object({
    name: z.string().min(1, 'Stop name is required').max(255, 'Stop name must be less than 255 characters'),
    latitude: z.number().min(-90, 'Latitude must be between -90 and 90').max(90, 'Latitude must be between -90 and 90').optional().nullable(),
    longitude: z.number().min(-180, 'Longitude must be between -180 and 180').max(180, 'Longitude must be between -180 and 180').optional().nullable(),
    address: z.string().max(500, 'Address must be less than 500 characters').optional().nullable(),
    sequence: z.number().int().min(0, 'Sequence must be a non-negative integer').optional(),
    order: z.number().int().min(0, 'Order must be a non-negative integer').optional(),
    routeId: z.uuid('Route ID must be a valid UUID').optional().nullable(),
    estimatedArrivalTime: z.iso.datetime('Invalid estimated arrival time format').optional().nullable(),
});

// Create Stop schema
export const CreateStopSchema = BaseStopSchema.required({
    name: true,
});

// Update Stop schema (all fields optional except constraints)
export const UpdateStopSchema = BaseStopSchema.partial();

// Stop ID parameter schema
export const StopIdParamSchema = z.object({
    id: z.uuid('Stop ID must be a valid UUID'),
});

// Assign Employee schema
export const AssignEmployeeSchema = z.object({
    employeeId: z.uuid('Employee ID must be a valid UUID').optional().nullable(),
});

// Reorder Stop schema
export const ReorderStopSchema = z.object({
    sequence: z.number().int().min(0, 'Sequence must be a non-negative integer').optional(),
    order: z.number().int().min(0, 'Order must be a non-negative integer').optional(),
}).refine(data => data.sequence !== undefined || data.order !== undefined, {
    message: "At least one of 'sequence' or 'order' must be provided"
});

// Query parameter schemas
export const StopsByRouteParamSchema = z.object({
    routeId: z.string().uuid('Route ID must be a valid UUID'),
});

// Export types for TypeScript
export type CreateStopInput = z.infer<typeof CreateStopSchema>;
export type UpdateStopInput = z.infer<typeof UpdateStopSchema>;
export type AssignEmployeeInput = z.infer<typeof AssignEmployeeSchema>;
export type ReorderStopInput = z.infer<typeof ReorderStopSchema>;
