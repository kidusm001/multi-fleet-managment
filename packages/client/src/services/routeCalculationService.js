import { optimizeRoute } from './routeOptimization';
import { fetchHQLocation } from './hqLocationService';

/**
 * Calculate route metrics using route optimization
 * @param {Array} coordinates Array of [longitude, latitude] pairs
 * @param {Array} startLocation Optional [longitude, latitude] start location (defaults to HQ)
 * @returns {Promise<{totalDistance: number, totalTime: number}>}
 */
export async function calculateRouteMetrics(coordinates, startLocation = null) {
    if (!coordinates || coordinates.length < 2) {
        throw new Error('Need at least 2 coordinates to calculate route');
    }

    try {
        // Use provided start location or fall back to HQ
        let fallbackStart = startLocation;
        if (!fallbackStart) {
            const hqLocation = await fetchHQLocation();
            fallbackStart = hqLocation?.coords || null;
        }

        if (!Array.isArray(fallbackStart) || fallbackStart.length !== 2) {
            throw new Error('HQ location is not configured. Please add an HQ location in the admin portal.');
        }
        
        // Add start location as start and end point
        const routeCoordinates = [
            fallbackStart,
            ...coordinates,
            fallbackStart
        ];

        // Optimize the route
        const optimizedResult = await optimizeRoute({
            coordinates: routeCoordinates
        });

        // Calculate total distance using optimized coordinates
        let totalDistance = 0;
        for (let i = 0; i < optimizedResult.coordinates.length - 1; i++) {
            const point1 = optimizedResult.coordinates[i];
            const point2 = optimizedResult.coordinates[i + 1];
            
            const lat1 = point1[1];
            const lon1 = point1[0];
            const lat2 = point2[1];
            const lon2 = point2[0];

            // Calculate distance using Haversine formula
            const R = 6371; // Earth's radius in km
            const dLat = (lat2 - lat1) * Math.PI / 180;
            const dLon = (lon2 - lon1) * Math.PI / 180;
            const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
                      Math.sin(dLon/2) * Math.sin(dLon/2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
            totalDistance += R * c;
        }

        // Estimate time based on average speed of 40 km/h
        const averageSpeed = 40; // km/h
        const totalTime = (totalDistance / averageSpeed) * 60; // Convert to minutes

        return {
            totalDistance: Math.round(totalDistance * 10) / 10, // Round to 1 decimal place
            totalTime: Math.ceil(totalTime),
        };
    } catch (error) {
        console.error('Error calculating route metrics:', error);
        throw new Error('Failed to calculate route metrics: ' + error.message);
    }
}
