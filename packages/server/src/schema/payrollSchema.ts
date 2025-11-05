import { z } from 'zod';

/**
 * Schema for generating payroll with filters
 * Similar to notification date ranges
 */
export const GeneratePayrollSchema = z.object({
  // Date range (required)
  startDate: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
  endDate: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
  
  // Optional filters
  vehicleType: z.enum(['IN_HOUSE', 'OUTSOURCED']).optional(),
  shiftIds: z.array(z.string()).optional(),
  departmentIds: z.array(z.string()).optional(),
  locationIds: z.array(z.string()).optional(), // Branch filter
  vehicleIds: z.array(z.string()).optional(),
  
  // Payroll period name (optional, will be auto-generated if not provided)
  name: z.string().optional(),
});

export type GeneratePayrollInput = z.infer<typeof GeneratePayrollSchema>;
