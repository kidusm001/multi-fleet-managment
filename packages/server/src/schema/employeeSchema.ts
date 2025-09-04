import { z } from "zod";

export const EmployeeIdParam = z.object({
    id: z.uuid('Invalid Employee ID format'),
});

export const CreateEmployeeSchema = z.object({
    name: z.string().min(1).max(255),
    location: z.string().nullable(),
    departmentId: z.uuid('Invalid Department ID format'),
    shiftId: z.uuid('Invalid Shift ID format'),
    stopId: z.uuid('Invalid Stop ID format').nullable(),
    userId: z.uuid('Invalid User ID format'),
});


export const UpdateEmployeeSchema = z.object({
    name: z.string().min(1).max(255),
    location: z.string().nullable(),
    departmentId: z.uuid('Invalid Department ID format'),
    shiftId: z.uuid('Invalid Shift ID format'),
    stopId: z.uuid('Invalid Stop ID format').nullable(),
    userId: z.uuid('Invalid User ID format'),
});

export type CreateEmployee = z.infer<typeof CreateEmployeeSchema>;