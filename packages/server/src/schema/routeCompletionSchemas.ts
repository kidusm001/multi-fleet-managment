import { z } from 'zod';

/**
 * Schema for completing a route
 * Minimal information required to record route completion
 */
export const CompleteRouteSchema = z.object({
  routeId: z.string().cuid('Invalid route ID format'),
});

export type CompleteRouteInput = z.infer<typeof CompleteRouteSchema>;

/**
 * Query params for getting route completions
 */
export const RouteCompletionQuerySchema = z.object({
  driverId: z.string().cuid().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).optional(),
});

export type RouteCompletionQuery = z.infer<typeof RouteCompletionQuerySchema>;
