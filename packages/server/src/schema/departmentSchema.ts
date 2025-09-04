import { z } from 'zod';

export const DepartmentIdParam = z.object({
    id: z.cuid('Invalid department ID format'),
});

export const OrganizationIdParam = z.object({
    organizationId: z.string().min(1, 'Organization ID is required'),
});

export const CreateDepartmentSchema = z.object({
    name: z.string().min(1).max(255),
});

export const SuperadminCreateDepartmentSchema = z.object({
    name: z.string().min(1).max(255),
    organizationId: z.string().min(1, 'Organization ID is required'),
});

export const UpdateDepartmentSchema = z.object({
    name: z.string().min(1).max(255),
});

export const DeleteDepartmentQuery = z.object({
    force: z.enum(['true', 'false']).optional(),
});

export const EmployeeListQuery = z.object({
    includeDeleted: z.enum(['true', 'false']).optional(),
});