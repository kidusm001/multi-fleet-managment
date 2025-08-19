import { MAPBOX_ACCESS_TOKEN } from '@/config';

// Create a web worker instance
let worker = null;


/**
 * Optimizes a route using Mapbox Directions API and returns precise travel metrics
 * with adjustments to make travel times more realistic
 * 
 * @param {Object} routeData - The route data including coordinates
 * @returns {Object} Optimized route with adjusted distance and duration from Mapbox
 */
export async function optimizeRoute(routeData) {
    // Input validation
    if (!routeData || !routeData.coordinates || !Array.isArray(routeData.coordinates)) {
        console.error('Invalid route data provided:', routeData);
        return {
            coordinates: [],
            areas: [],
            metrics: {
                totalDistance: 0,
                totalTime: 0,
                rawData: null
            }
        };
    }

    const coordinates = routeData.coordinates;
    const areas = routeData.areas || [];

    try {
        // Format coordinates for Mapbox Directions API
        const waypointsString = coordinates.map(coord => `${coord[0]},${coord[1]}`).join(';');

        // Call Mapbox Directions API - setting steps=false to avoid extra detail points
        const directionsUrl = `https://api.mapbox.com/directions/v5/mapbox/driving/${waypointsString}?geometries=geojson&overview=full&steps=false&access_token=${MAPBOX_ACCESS_TOKEN}`;

        const response = await fetch(directionsUrl);
        if (!response.ok) {
            throw new Error(`Mapbox Directions API error: ${response.status}`);
        }

        const data = await response.json();

        // Verify that we received valid data
        if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
            throw new Error(`No valid route found: ${data.code || 'Unknown error'}`);
        }

        const route = data.routes[0];

        // Extract and adjust metrics from the Mapbox response
        const metersToKm = (meters) => (meters / 1000).toFixed(1);
        const secondsToMinutes = (seconds) => Math.ceil(seconds / 60);

        // Calculate number of stops (excluding HQ at start and end)
        const numberOfStops = coordinates.length - 2;

        // Adjust time based on number of stops
        let adjustedDuration = route.duration;
        if (numberOfStops > 0) {
            // Get the base duration in minutes
            const durationInMinutes = secondsToMinutes(route.duration);

            // Apply time reduction based on duration
            if (durationInMinutes > 50) {
                // For longer routes, reduce by 12 mins per stop
                adjustedDuration = Math.max(route.duration - ((numberOfStops - 2) * 12 * 60), 10 * 60);
            } else {
                // For shorter routes, reduce by 6 mins per stop
                adjustedDuration = Math.max(route.duration - ((numberOfStops - 2) * 6 * 60), 5 * 60);
            }
        }

        // Create waypoints array to maintain the original order but with optimized route data
        const waypoints = coordinates.map((coord, index) => ({
            location: coord,
            originalIndex: index
        }));

        // Return optimized route with precise metrics, but PRESERVE the original waypoints
        // This ensures we don't add hundreds of intermediate points to the map
        return {
            // Return only original waypoints for display, not all intermediate route points
            coordinates: coordinates,
            waypoints: waypoints,
            areas,
            metrics: {
                totalDistance: parseFloat(metersToKm(route.distance)),
                totalTime: secondsToMinutes(adjustedDuration), // Use adjusted duration
                rawData: {
                    distance: route.distance,  // In meters
                    originalDuration: route.duration,  // Original seconds
                    adjustedDuration: adjustedDuration, // Adjusted seconds
                    legs: route.legs          // Detailed segment information
                }
            },
            // Include the full route geometry for drawing the route line (if needed)
            fullRouteGeometry: route.geometry.coordinates
        };
    } catch (error) {
        console.error('Route optimization error:', error);

        // Return empty results in case of error
        return {
            coordinates: [],
            areas: [],
            metrics: {
                totalDistance: 0,
                totalTime: 0,
                error: error.message,
                rawData: null
            }
        };
    }
}

// Cleanup worker on page unload
if (typeof window !== 'undefined') {
    window.addEventListener('unload', () => {
        if (worker) {
            worker.terminate();
            worker = null;
        }
    });
}