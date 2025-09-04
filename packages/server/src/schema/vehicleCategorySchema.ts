import { z } from 'zod';

export const VehicleCategoryIdParam = z.object({
  id: z.string().uuid('Invalid vehicle category ID format'),
});

export const CreateVehicleCategorySchema = z.object({
  name: z.string().min(1, 'Category name is required').trim(),
  capacity: z.number().int().positive('Capacity must be a positive number'),
});

export const UpdateVehicleCategorySchema = z.object({
  name: z.string().min(1, 'Category name cannot be empty').trim().optional(),
  capacity: z.number().int().positive('Capacity must be a positive number').optional(),
});

export type CreateVehicleCategoryInput = z.infer<typeof CreateVehicleCategorySchema>;
export type UpdateVehicleCategoryInput = z.infer<typeof UpdateVehicleCategorySchema>;
export type VehicleCategoryIdParam = z.infer<typeof VehicleCategoryIdParam>;
