import { z } from "zod";

export const ServiceProviderIdParam = z.object({
    id: z.cuid('Invalid Service Provider ID format'),
});

export const CreateServiceProviderSchema = z.object({
    companyName: z.string().min(1, 'Company name is required').max(255),
    contactPerson: z.string().min(1, 'Contact person is required').max(255),
    email: z.email('Invalid email format'),
    phoneNumber: z.string().min(1, 'Phone number is required').max(50),
    address: z.string().max(500).nullable().optional(),
    
    // Contract terms
    monthlyRate: z.number().min(0, 'Monthly rate must be positive').nullable().optional(),
    perKmRate: z.number().min(0, 'Per km rate must be positive').nullable().optional(),
    perTripRate: z.number().min(0, 'Per trip rate must be positive').nullable().optional(),
    
    // Banking details
    bankAccountNumber: z.string().max(255).nullable().optional(),
    bankName: z.string().max(255).nullable().optional(),
    
    isActive: z.boolean().default(true).optional(),
});

export const UpdateServiceProviderSchema = z.object({
    companyName: z.string().min(1, 'Company name cannot be empty').max(255).optional(),
    contactPerson: z.string().min(1, 'Contact person cannot be empty').max(255).optional(),
    email: z.email('Invalid email format').optional(),
    phoneNumber: z.string().min(1, 'Phone number cannot be empty').max(50).optional(),
    address: z.string().max(500).nullable().optional(),
    
    // Contract terms
    monthlyRate: z.number().min(0, 'Monthly rate must be positive').nullable().optional(),
    perKmRate: z.number().min(0, 'Per km rate must be positive').nullable().optional(),
    perTripRate: z.number().min(0, 'Per trip rate must be positive').nullable().optional(),
    
    // Banking details
    bankAccountNumber: z.string().max(255).nullable().optional(),
    bankName: z.string().max(255).nullable().optional(),
    
    isActive: z.boolean().optional(),
});

export type CreateServiceProvider = z.infer<typeof CreateServiceProviderSchema>;
export type UpdateServiceProvider = z.infer<typeof UpdateServiceProviderSchema>;
