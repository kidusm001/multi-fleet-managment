/* eslint-disable no-restricted-globals */

// Constants for optimization
const EARTH_RADIUS = 6371; // Earth's radius in kilometers
const DEG_TO_RAD = Math.PI / 180;

// Calculate distance between two points using Haversine formula
function calculateDistance(point1, point2) {
    const [lon1, lat1] = point1;
    const [lon2, lat2] = point2;

    const dLat = (lat2 - lat1) * DEG_TO_RAD;
    const dLon = (lon2 - lon1) * DEG_TO_RAD;

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * DEG_TO_RAD) * Math.cos(lat2 * DEG_TO_RAD) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return EARTH_RADIUS * c;
}

// Optimize route using nearest neighbor algorithm with area constraints
function optimizeRoutePoints(coordinates, areas = []) {
    try {
        if (!coordinates?.length) {
            throw new Error('Invalid coordinates');
        }

        // If only one point, return as is
        if (coordinates.length === 1) {
            return {
                coordinates,
                areas,
            };
        }

        const visited = new Set();
        const optimizedCoordinates = [];
        const optimizedAreas = [];
        let currentPoint = coordinates[0];
        let currentArea = areas[0] || null;

        optimizedCoordinates.push(currentPoint);
        if (currentArea) optimizedAreas.push(currentArea);
        visited.add(coordinates.indexOf(currentPoint));

        while (visited.size < coordinates.length) {
            let minDistance = Infinity;
            let nextPoint = null;
            let nextArea = null;
            let nextIndex = -1;

            // Find nearest unvisited point
            coordinates.forEach((point, index) => {
                if (!visited.has(index)) {
                    const distance = calculateDistance(currentPoint, point);
                    if (distance < minDistance) {
                        minDistance = distance;
                        nextPoint = point;
                        nextArea = areas[index] || null;
                        nextIndex = index;
                    }
                }
            });

            if (nextPoint) {
                optimizedCoordinates.push(nextPoint);
                if (nextArea) optimizedAreas.push(nextArea);
                visited.add(nextIndex);
                currentPoint = nextPoint;
            }
        }

        return {
            coordinates: optimizedCoordinates,
            areas: optimizedAreas,
        };
    } catch (error) {
        throw new Error(`Route optimization failed: ${error.message}`);
    }
}

// Handle messages from main thread
self.addEventListener('message', (event) => {
    const { type, route } = event.data;

    if (type === 'optimize') {
        try {
            const optimizedRoute = optimizeRoutePoints(route.coordinates, route.areas);
            self.postMessage({ type: 'success', data: optimizedRoute });
        } catch (error) {
            self.postMessage({ type: 'error', error: error.message });
        }
    }
}); 