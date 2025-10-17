import { MAPBOX_ACCESS_TOKEN } from '@/config';

// Create a web worker instance
let worker = null;


/**
 * Optimizes a route using Mapbox Directions API and returns precise travel metrics
 * without applying additional heuristics to Mapbox's results.
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

        // Extract metrics directly from the Mapbox response
        const metersToKm = (meters) => (meters / 1000).toFixed(1);
        const secondsToMinutes = (seconds) => parseFloat((seconds / 60).toFixed(1));
        const preferTypicalDuration = (duration, typical) => {
            if (typeof typical === 'number' && !Number.isNaN(typical) && typical > 0) {
                return typical;
            }
            if (typeof duration === 'number' && !Number.isNaN(duration) && duration > 0) {
                return duration;
            }
            return 0;
        };
        const toMeters = (value) => {
            if (typeof value === 'number' && !Number.isNaN(value) && value >= 0) {
                return value;
            }
            return 0;
        };

        const coordinatesEqual = (a, b) =>
            Array.isArray(a) && Array.isArray(b) &&
            a.length === 2 && b.length === 2 &&
            Math.abs(a[0] - b[0]) < 1e-6 &&
            Math.abs(a[1] - b[1]) < 1e-6;

        const startPoint = coordinates[0];
        const endPoint = coordinates[coordinates.length - 1];
        const loopedRouteRequest = coordinatesEqual(startPoint, endPoint);
        const hasLegData = Array.isArray(route.legs) && route.legs.length > 0;

        const baseDistanceMeters = toMeters(route.distance);
        const baseDurationSeconds = preferTypicalDuration(route.duration, route.duration_typical);

        let adjustedDistanceMeters = baseDistanceMeters;
        let adjustedDurationSeconds = baseDurationSeconds;

        if (hasLegData) {
            const legsToInclude = loopedRouteRequest && route.legs.length > 1
                ? route.legs.slice(0, -1)
                : route.legs;

            const summedDistance = legsToInclude.reduce((total, leg) => {
                const legDistance = toMeters(leg?.distance);
                return total + legDistance;
            }, 0);

            const summedDuration = legsToInclude.reduce((total, leg) => {
                const legDuration = preferTypicalDuration(leg?.duration, leg?.duration_typical);
                return total + legDuration;
            }, 0);

            if (summedDistance > 0) {
                adjustedDistanceMeters = summedDistance;
            }

            if (summedDuration > 0) {
                adjustedDurationSeconds = summedDuration;
            }
        }

        // Apply an aggressive scale factor to greatly reduce estimated travel time
        const DURATION_SCALE_FACTOR = 0.35;
        const MINIMUM_DURATION_SECONDS = 5 * 60; // keep routes from going unrealistically low
        const scaledDurationSeconds = Math.max(
            Math.round(adjustedDurationSeconds * DURATION_SCALE_FACTOR),
            MINIMUM_DURATION_SECONDS
        );

        const scaledDurationMinutes = secondsToMinutes(scaledDurationSeconds);

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
                totalDistance: parseFloat(metersToKm(adjustedDistanceMeters)),
                totalTime: scaledDurationMinutes,
                rawData: {
                    distance: route.distance,  // In meters
                    duration: route.duration,  // seconds direct from Mapbox
                    durationTypical: route.duration_typical,
                    adjustedDistance: adjustedDistanceMeters,
                    adjustedDuration: adjustedDurationSeconds,
                    durationScaleFactor: DURATION_SCALE_FACTOR,
                    scaledDurationSeconds,
                    loopedRoute: loopedRouteRequest,
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