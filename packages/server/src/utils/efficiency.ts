import { Route } from '@prisma/client';

export function calculateEfficiency(routes: Route[]): number {
  if (routes.length === 0) return 0;

  // Base efficiency calculation on route metrics
  let totalEfficiency = routes.reduce((sum, route) => {
    // Calculate time efficiency (actual vs expected time)
    const expectedTime = route.totalDistance / 40; // Assuming 40km/h average speed
    const timeEfficiency = Math.min(expectedTime / route.totalTime, 1) * 100;

    // Calculate distance efficiency (actual vs optimal distance)
    const distanceEfficiency = Math.min((route.totalDistance * 0.8) / route.totalDistance, 1) * 100;

    // Combine both metrics
    return sum + (timeEfficiency * 0.6 + distanceEfficiency * 0.4);
  }, 0);

  // Return average efficiency rounded to nearest integer
  return Math.round(totalEfficiency / routes.length);
}