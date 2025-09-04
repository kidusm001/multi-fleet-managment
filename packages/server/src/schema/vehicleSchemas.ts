import { z } from 'zod';

// Enum schemas
export const VehicleTypeSchema = z.enum(['IN_HOUSE', 'OUTSOURCED']);
export const VehicleStatusSchema = z.enum(['AVAILABLE', 'IN_USE', 'MAINTENANCE', 'OUT_OF_SERVICE', 'INACTIVE']);

// Base vehicle data schema for common fields
const BaseVehicleSchema = z.object({
  plateNumber: z.string().min(1, 'Plate number is required').trim(),
  name: z.string().optional(),
  model: z.string().min(1, 'Model is required').trim(),
  make: z.string().optional(),
  type: VehicleTypeSchema.optional().default('IN_HOUSE'),
  vendor: z.string().optional(),
  capacity: z.number().int().positive('Capacity must be a positive number'),
  year: z.number()
    .int()
    .min(1900, 'Year must be 1900 or later')
    .max(new Date().getFullYear() + 1, 'Year cannot be in the future')
    .optional()
    .nullable(),
  status: VehicleStatusSchema.optional().default('AVAILABLE'),
  lastMaintenance: z.iso.datetime().optional().nullable(),
  nextMaintenance: z.iso.datetime().optional().nullable(),
  dailyRate: z.number().positive('Daily rate must be positive').optional().nullable(),
  categoryId: z.uuid('Invalid category ID format').optional().nullable(),
  driverId: z.uuid('Invalid driver ID format').optional().nullable(),
});

// Schema for creating a new vehicle
export const CreateVehicleSchema = BaseVehicleSchema.extend({
  organizationId: z.uuid('Invalid organization ID format').min(1, 'Organization ID is required'),
});

// Schema for updating a vehicle (all fields optional except validation rules)
export const UpdateVehicleSchema = z.object({
  plateNumber: z.string().min(1, 'Plate number cannot be empty').trim().optional(),
  name: z.string().optional(),
  model: z.string().min(1, 'Model cannot be empty').trim().optional(),
  make: z.string().optional(),
  type: VehicleTypeSchema.optional(),
  vendor: z.string().optional(),
  capacity: z.number().int().positive('Capacity must be a positive number').optional(),
  year: z.number()
    .int()
    .min(1900, 'Year must be 1900 or later')
    .max(new Date().getFullYear() + 1, 'Year cannot be in the future')
    .optional()
    .nullable(),
  status: VehicleStatusSchema.optional(),
  lastMaintenance: z.iso.datetime().optional().nullable(),
  nextMaintenance: z.iso.datetime().optional().nullable(),
  dailyRate: z.number().positive('Daily rate must be positive').optional().nullable(),
  categoryId: z.uuid('Invalid category ID format').optional().nullable(),
  driverId: z.uuid('Invalid driver ID format').optional().nullable(),
  isActive: z.boolean().optional(),
});

// Schema for assigning/unassigning a driver
export const AssignDriverSchema = z.object({
  driverId: z.uuid('Invalid driver ID format').optional().nullable(),
});

// Schema for updating vehicle status
export const UpdateVehicleStatusSchema = z.object({
  status: VehicleStatusSchema,
});

// Schema for vehicle ID parameter
export const VehicleIdParamSchema = z.object({
  id: z.uuid('Invalid vehicle ID format'),
});

// Schema for organization ID parameter
export const OrganizationIdParamSchema = z.object({
  organizationId: z.string().uuid('Invalid organization ID format'),
});

// Schema for query parameters when fetching vehicles by organization
export const VehiclesByOrganizationQuerySchema = z.object({
  includeDeleted: z.string().optional().transform((val) => val === 'true'),
});

// Schema for pagination (if needed in the future)
export const PaginationQuerySchema = z.object({
  page: z.string().optional().transform((val) => val ? parseInt(val, 10) : 1),
  limit: z.string().optional().transform((val) => val ? parseInt(val, 10) : 10),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional().default('asc'),
});

// Type exports for TypeScript
export type CreateVehicleInput = z.infer<typeof CreateVehicleSchema>;
export type UpdateVehicleInput = z.infer<typeof UpdateVehicleSchema>;
export type AssignDriverInput = z.infer<typeof AssignDriverSchema>;
export type UpdateVehicleStatusInput = z.infer<typeof UpdateVehicleStatusSchema>;
export type VehicleIdParam = z.infer<typeof VehicleIdParamSchema>;
export type OrganizationIdParam = z.infer<typeof OrganizationIdParamSchema>;
export type VehiclesByOrganizationQuery = z.infer<typeof VehiclesByOrganizationQuerySchema>;
export type PaginationQuery = z.infer<typeof PaginationQuerySchema>;

