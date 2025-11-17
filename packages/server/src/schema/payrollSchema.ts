import { z } from 'zod';

/**
 * Schema for generating payroll with filters
 * Only includes filters that can be directly applied to AttendanceRecord
 */
export const GeneratePayrollSchema = z.object({
  // Date range (required)
  startDate: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
  endDate: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
  
  // Optional filters (only vehicle-related filters work with current schema)
  vehicleType: z.enum(['IN_HOUSE', 'OUTSOURCED']).optional(),
  vehicleIds: z.array(z.string()).optional(),
  
  // Payroll period name (optional, will be auto-generated if not provided)
  name: z.string().optional(),
});

export type GeneratePayrollInput = z.infer<typeof GeneratePayrollSchema>;
