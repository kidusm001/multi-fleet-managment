import { z } from "zod";

export const ShiftIdParam = z.object({
    id: z.cuid('Invalid Shift ID format'),
});

export const CreateShiftSchema = z.object({
    name: z.string().min(1).max(255),
    startTime: z.iso.datetime({ offset: true }),
    endTime: z.iso.datetime({ offset: true }),
    timeZone: z.string().min(1),
});

export const UpdateShiftSchema = z.object({
    name: z.string().min(1).max(255).optional(),
    startTime: z.iso.datetime({ offset: true }).optional(),
    endTime: z.iso.datetime({ offset: true }).optional(),
    timeZone: z.string().min(1).optional(),
}).refine(data => {
    if (data.startTime && data.endTime) {
        return new Date(data.startTime) < new Date(data.endTime);
    }
    return true;
}, {
    message: "startTime must be before endTime",
    path: ["startTime", "endTime"],
});

export type CreateShift = z.infer<typeof CreateShiftSchema>;
export type UpdateShift = z.infer<typeof UpdateShiftSchema>;
