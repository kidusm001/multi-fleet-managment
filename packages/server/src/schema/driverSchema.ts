import { z } from "zod";

export const DriverIdParam = z.object({
    id: z.cuid('Invalid Driver ID format'),
});

export const CreateDriverSchema = z.object({
    name: z.string().min(1).max(255),
    email: z.email().nullable(),
    licenseNumber: z.string().min(1).max(255),
    phoneNumber: z.string().min(1).max(255).nullable(),
    status: z.enum(['ACTIVE', 'OFF_DUTY', 'ON_BREAK', 'INACTIVE']).default('ACTIVE'),
    experienceYears: z.number().int().min(0).nullable(),
    rating: z.number().min(0).max(5).default(0.0),
    isActive: z.boolean().default(true),
    // Payroll fields
    baseSalary: z.number().min(0).nullable().optional(),
    hourlyRate: z.number().min(0).nullable().optional(),
    overtimeRate: z.number().min(0).default(1.5).optional(),
    // Banking details
    bankAccountNumber: z.string().max(255).nullable().optional(),
    bankName: z.string().max(255).nullable().optional(),
    vehicleId: z.cuid('Invalid vehicle ID format').nullable().optional(),
});

export const UpdateDriverSchema = z.object({
    name: z.string().min(1).max(255).optional(),
    email: z.email().nullable().optional(),
    licenseNumber: z.string().min(1).max(255).optional(),
    phoneNumber: z.string().min(1).max(255).nullable().optional(),
    status: z.enum(['ACTIVE', 'OFF_DUTY', 'ON_BREAK', 'INACTIVE']).optional(),
    experienceYears: z.number().int().min(0).nullable().optional(),
    rating: z.number().min(0).max(5).optional(),
    isActive: z.boolean().optional(),
    // Payroll fields
    baseSalary: z.number().min(0).nullable().optional(),
    hourlyRate: z.number().min(0).nullable().optional(),
    overtimeRate: z.number().min(0).optional(),
    // Banking details
    bankAccountNumber: z.string().max(255).nullable().optional(),
    bankName: z.string().max(255).nullable().optional(),
    vehicleId: z.cuid('Invalid vehicle ID format').nullable().optional(),
});

export type CreateDriver = z.infer<typeof CreateDriverSchema>;
export type UpdateDriver = z.infer<typeof UpdateDriverSchema>;
