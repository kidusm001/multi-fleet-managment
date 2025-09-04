import { z } from "zod";

export const EmployeeIdParam = z.object({
    id: z.cuid('Invalid Employee ID format'),
});

export const CreateEmployeeSchema = z.object({
    name: z.string().min(1).max(255),
    location: z.string().nullable(),
    departmentId: z.cuid('Invalid Department ID format'),
    shiftId: z.cuid('Invalid Shift ID format'),
    stopId: z.cuid('Invalid Stop ID format').nullable(),
    userId: z.string().min(1, 'User ID is required'),
});


export const UpdateEmployeeSchema = z.object({
    name: z.string().min(1).max(255),
    location: z.string().nullable(),
    departmentId: z.cuid('Invalid Department ID format'),
    shiftId: z.cuid('Invalid Shift ID format'),
    stopId: z.cuid('Invalid Stop ID format').nullable(),
    userId: z.string().min(1, 'User ID is required'),
});

export type CreateEmployee = z.infer<typeof CreateEmployeeSchema>;