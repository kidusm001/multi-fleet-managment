import { z } from "zod";

export const EmployeeIdParam = z.object({
    id: z.cuid('Invalid Employee ID format'),
});

export const OrganizationIdParam = z.object({
    organizationId: z.cuid('Invalid Organization ID format'),
});

export const DepartmentIdParam = z.object({
    departmentId: z.cuid('Invalid Department ID format'),
});

export const ShiftIdParam = z.object({
    shiftId: z.cuid('Invalid Shift ID format'),
});

export const WorkLocationIdParam = z.object({
    workLocationId: z.cuid('Invalid Work Location ID format'),
});

export const CreateEmployeeSchema = z.object({
    name: z.string().min(1).max(255),
    location: z.string().nullable(),
    departmentId: z.cuid('Invalid Department ID format'),
    shiftId: z.cuid('Invalid Shift ID format'),
    stopId: z.cuid('Invalid Stop ID format').nullable(),
    userId: z.string().min(1, 'User ID is required'),
    locationId: z.cuid('Invalid Location ID format').nullable(),
});


export const UpdateEmployeeSchema = z.object({
    name: z.string().min(1).max(255),
    location: z.string().nullable(),
    departmentId: z.cuid('Invalid Department ID format'),
    shiftId: z.cuid('Invalid Shift ID format'),
    stopId: z.cuid('Invalid Stop ID format').nullable(),
    userId: z.string().min(1, 'User ID is required'),
    locationId: z.cuid('Invalid Location ID format').nullable(),
});

export const SuperAdminCreateEmployeeSchema = CreateEmployeeSchema.extend({
    organizationId: z.cuid('Invalid Organization ID format'),
    assigned: z.boolean().optional(),
});

export const SuperAdminUpdateEmployeeSchema = z.object({
    name: z.string().min(1).max(255).optional(),
    location: z.string().nullable().optional(),
    departmentId: z.cuid('Invalid Department ID format').optional(),
    shiftId: z.cuid('Invalid Shift ID format').optional(),
    stopId: z.cuid('Invalid Stop ID format').nullable().optional(),
    assigned: z.boolean().optional(),
});

export type CreateEmployee = z.infer<typeof CreateEmployeeSchema>;
export type SuperAdminCreateEmployee = z.infer<typeof SuperAdminCreateEmployeeSchema>;