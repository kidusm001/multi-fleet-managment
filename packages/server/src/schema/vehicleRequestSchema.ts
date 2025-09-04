import { z } from 'zod';

// Enum schemas
export const ApprovalStatusSchema = z.enum(['PENDING', 'APPROVED', 'REJECTED']);

// Base vehicle request data schema for common fields
const BaseVehicleRequestSchema = z.object({
  name: z.string().min(1, 'Vehicle name is required').trim(),
  licensePlate: z.string().min(1, 'License plate is required').trim(),
  capacity: z.number().int().positive('Capacity must be a positive number'),
  type: z.string().min(1, 'Vehicle type is required').trim(),
  model: z.string().min(1, 'Vehicle model is required').trim(),
  vendor: z.string().optional(),
  dailyRate: z.number().positive('Daily rate must be positive').optional().nullable(),
  categoryId: z.cuid('Invalid category ID format').optional().nullable(),
  comment: z.string().optional(),
});

// Schema for creating a new vehicle request
export const CreateVehicleRequestSchema = BaseVehicleRequestSchema.extend({
  requestedBy: z.string().min(1, 'Requester role is required'),
});

// Schema for updating a vehicle request (all fields optional except validation rules)
export const UpdateVehicleRequestSchema = z.object({
  name: z.string().min(1, 'Vehicle name cannot be empty').trim().optional(),
  licensePlate: z.string().min(1, 'License plate cannot be empty').trim().optional(),
  capacity: z.number().int().positive('Capacity must be a positive number').optional(),
  type: z.string().min(1, 'Vehicle type cannot be empty').trim().optional(),
  model: z.string().min(1, 'Vehicle model cannot be empty').trim().optional(),
  vendor: z.string().optional(),
  dailyRate: z.number().positive('Daily rate must be positive').optional().nullable(),
  categoryId: z.cuid('Invalid category ID format').optional().nullable(),
  comment: z.string().optional(),
  status: ApprovalStatusSchema.optional(),
  requestedBy: z.string().optional(),
  approvedBy: z.string().optional(),
});

// Schema for approving a vehicle request
export const ApproveVehicleRequestSchema = z.object({
  approverRole: z.string().min(1, 'Approver role is required'),
});

// Schema for rejecting a vehicle request
export const RejectVehicleRequestSchema = z.object({
  comment: z.string().min(1, 'Rejection comment is required'),
});

// Schema for vehicle request ID parameter
export const VehicleRequestIdParamSchema = z.object({
  id: z.cuid('Vehicle request ID is required'),
});

// Schema for query parameters when fetching vehicle requests
export const VehicleRequestQuerySchema = z.object({
  status: ApprovalStatusSchema.optional(),
  categoryId: z.string().optional(),
  requestedBy: z.string().optional(),
  includeDeleted: z.string().optional().transform((val) => val === 'true'),
});

// Type exports for TypeScript
export type CreateVehicleRequestInput = z.infer<typeof CreateVehicleRequestSchema>;
export type UpdateVehicleRequestInput = z.infer<typeof UpdateVehicleRequestSchema>;
export type ApproveVehicleRequestInput = z.infer<typeof ApproveVehicleRequestSchema>;
export type RejectVehicleRequestInput = z.infer<typeof RejectVehicleRequestSchema>;
export type VehicleRequestIdParam = z.infer<typeof VehicleRequestIdParamSchema>;
export type VehicleRequestQuery = z.infer<typeof VehicleRequestQuerySchema>;
