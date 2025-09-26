import { z } from 'zod';
import { LocationType } from '@prisma/client';

export const LocationIdParam = z.object({
    id: z.cuid('Invalid location ID format'),
});

export const OrganizationIdParam = z.object({
    organizationId: z.string().min(1, 'Organization ID is required'),
});

export const CreateLocationSchema = z.object({
    address: z.string().min(1, 'Address is required').max(500, 'Address must be less than 500 characters').optional().nullable(),
    latitude: z.number().min(-90, 'Latitude must be between -90 and 90').max(90, 'Latitude must be between -90 and 90').optional().nullable(),
    longitude: z.number().min(-180, 'Longitude must be between -180 and 180').max(180, 'Longitude must be between -180 and 180').optional().nullable(),
    type: z.nativeEnum(LocationType, { message: 'Invalid location type' }),
});

export const SuperadminCreateLocationSchema = z.object({
    address: z.string().min(1, 'Address is required').max(500, 'Address must be less than 500 characters').optional().nullable(),
    latitude: z.number().min(-90, 'Latitude must be between -90 and 90').max(90, 'Latitude must be between -90 and 90').optional().nullable(),
    longitude: z.number().min(-180, 'Longitude must be between -180 and 180').max(180, 'Longitude must be between -180 and 180').optional().nullable(),
    type: z.nativeEnum(LocationType, { message: 'Invalid location type' }),
    organizationId: z.string().min(1, 'Organization ID is required'),
});

export const UpdateLocationSchema = z.object({
    address: z.string().min(1, 'Address is required').max(500, 'Address must be less than 500 characters').optional().nullable(),
    latitude: z.number().min(-90, 'Latitude must be between -90 and 90').max(90, 'Latitude must be between -90 and 90').optional().nullable(),
    longitude: z.number().min(-180, 'Longitude must be between -180 and 180').max(180, 'Longitude must be between -180 and 180').optional().nullable(),
    type: z.nativeEnum(LocationType, { message: 'Invalid location type' }).optional(),
});

export const LocationTypeQuery = z.object({
    type: z.nativeEnum(LocationType).optional(),
});

export const EmployeeListQuery = z.object({
    includeDeleted: z.enum(['true', 'false']).optional(),
});

export const RouteListQuery = z.object({
    includeInactive: z.enum(['true', 'false']).optional(),
});

// Export types for TypeScript
export type CreateLocationInput = z.infer<typeof CreateLocationSchema>;
export type SuperadminCreateLocationInput = z.infer<typeof SuperadminCreateLocationSchema>;
export type UpdateLocationInput = z.infer<typeof UpdateLocationSchema>;
export type LocationIdParamInput = z.infer<typeof LocationIdParam>;
export type OrganizationIdParamInput = z.infer<typeof OrganizationIdParam>;
export type LocationTypeQueryInput = z.infer<typeof LocationTypeQuery>;
export type EmployeeListQueryInput = z.infer<typeof EmployeeListQuery>;
export type RouteListQueryInput = z.infer<typeof RouteListQuery>;