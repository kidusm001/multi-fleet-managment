import { z } from 'zod';

// Employee location schema for clustering
export const EmployeeLocationSchema = z.object({
    id: z.cuid('Employee ID must be a valid CUID'),
    name: z.string().min(1, 'Employee name is required'),
    location: z.string().min(1, 'Employee location is required'),
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
});

// Vehicle/Shuttle schema for clustering
export const VehicleClusterSchema = z.object({
    id: z.cuid('Vehicle ID must be a valid CUID'),
    capacity: z.number().min(1, 'Vehicle capacity must be at least 1'),
    name: z.string().optional(),
});

// Clustering request schema
export const ClusteringRequestSchema = z.object({
    employees: z.array(EmployeeLocationSchema).min(1, 'At least one employee is required'),
    vehicles: z.array(VehicleClusterSchema).min(1, 'At least one vehicle is required'),
    shiftId: z.cuid('Shift ID must be a valid CUID').optional(),
    date: z.iso.datetime('Invalid date format').optional(),
});

// Cluster optimization schema
export const ClusterOptimizeSchema = z.object({
    shiftId: z.cuid('Shift ID must be a valid CUID'),
    date: z.iso.datetime('Invalid date format'),
});

// Specific vehicle cluster schema
export const SpecificVehicleClusterSchema = z.object({
    date: z.iso.datetime('Invalid date format'),
});

// Vehicle availability check schema
export const VehicleAvailabilitySchema = z.object({
    date: z.iso.datetime('Invalid date format'),
});

// Parameter schemas
export const ShiftIdParamSchema = z.object({
    shiftId: z.cuid('Shift ID must be a valid CUID'),
});

export const VehicleIdParamSchema = z.object({
    vehicleId: z.cuid('Vehicle ID must be a valid CUID'),
});

export const ShiftVehicleParamSchema = z.object({
    shiftId: z.cuid('Shift ID must be a valid CUID'),
    vehicleId: z.cuid('Vehicle ID must be a valid CUID'),
});

// Export types for TypeScript
export type EmployeeLocationInput = z.infer<typeof EmployeeLocationSchema>;
export type VehicleClusterInput = z.infer<typeof VehicleClusterSchema>;
export type ClusteringRequestInput = z.infer<typeof ClusteringRequestSchema>;
export type ClusterOptimizeInput = z.infer<typeof ClusterOptimizeSchema>;
export type SpecificVehicleClusterInput = z.infer<typeof SpecificVehicleClusterSchema>;
export type VehicleAvailabilityInput = z.infer<typeof VehicleAvailabilitySchema>;
