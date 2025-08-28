import { z } from 'zod';

// Permissive Employee schema – only validate shape we actually consume in UI.
export const EmployeeSchema = z.object({
  id: z.union([z.string(), z.number()]),
  name: z.string().min(1).optional().catch(''),
  location: z.string().optional().catch(''),
  departmentId: z.string().optional().or(z.number().optional()),
  shiftId: z.string().optional().or(z.number().optional()),
  assigned: z.boolean().optional().catch(false),
  deleted: z.boolean().optional().catch(false),
  status: z.string().optional().catch('active'),
  // Pass through unknown keys so we don't break while backend evolves
}).passthrough();

export const EmployeeListSchema = z.array(EmployeeSchema);

export function safeParseEmployees(data: unknown) {
  const result = EmployeeListSchema.safeParse(data);
  if (result.success) return result.data;
  console.warn('[EmployeeSchema] Validation failed – returning unvalidated raw data', result.error.issues);
  return Array.isArray(data) ? data : [];
}

export function safeParseEmployee<T = Record<string, unknown>>(data: unknown): T | null {
  const result = EmployeeSchema.safeParse(data);
  if (result.success) return result.data as unknown as T;
  console.warn('[EmployeeSchema] Single validation failed – returning raw object', result.error.issues);
  return (data && typeof data === 'object') ? data as T : null;
}
