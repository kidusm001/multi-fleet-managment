import { MAPBOX_ACCESS_TOKEN } from '@/config';

// Helper function to calculate distance between two points
function calculateDistance(point1, point2) {
  if (!point1 || !point2 || !Array.isArray(point1) || !Array.isArray(point2) || point1.length !== 2 || point2.length !== 2) {
    console.error('Invalid points provided to calculateDistance:', { point1, point2 });
    return null;
  }

  const [lon1, lat1] = point1;
  const [lon2, lat2] = point2;

  if (typeof lon1 !== 'number' || typeof lat1 !== 'number' || 
      typeof lon2 !== 'number' || typeof lat2 !== 'number' ||
      isNaN(lon1) || isNaN(lat1) || isNaN(lon2) || isNaN(lat2)) {
    console.error('Invalid coordinates in points:', { point1, point2 });
    return null;
  }

  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Find nearest unvisited point from current position
function findNearestPoint(current, points, visited) {
  if (!current || !points || !Array.isArray(points) || !visited || !Array.isArray(visited)) {
    console.error('Invalid arguments to findNearestPoint:', { current, points, visited });
    return -1;
  }

  if (visited.length !== points.length) {
    console.error('Visited array length does not match points array length');
    return -1;
  }

  let minDist = Infinity;
  let nearestIndex = -1;

  points.forEach((point, index) => {
    if (Object.prototype.hasOwnProperty.call(visited, index) && !visited[index] && Array.isArray(point) && point.length === 2) {
      const dist = calculateDistance(current, point);
      if (dist !== null && dist < minDist && Math.abs(dist - minDist) > Number.EPSILON) {
        minDist = dist;
        nearestIndex = index;
      }
    }
  });

  return nearestIndex;
}

// Initial ordering using nearest neighbor TSP
function getInitialOrder(hqCoords, dropOffPoints) {
  if (!hqCoords || !dropOffPoints || !Array.isArray(dropOffPoints) || !Array.isArray(hqCoords)) {
    console.error('Invalid arguments to getInitialOrder:', { hqCoords, dropOffPoints });
    return [];
  }

  const visited = new Array(dropOffPoints.length).fill(false);
  const order = [];
  let currentPoint = hqCoords;

  while (order.length < dropOffPoints.length) {
    const nextIndex = findNearestPoint(currentPoint, dropOffPoints, visited);
    if (nextIndex === -1) break;

    order.push(nextIndex);
    visited[nextIndex] = true;
    currentPoint = dropOffPoints[nextIndex];
  }

  return order;
}

// Retry function with exponential backoff
async function retryFetch(url, options = {}, maxRetries = 3) {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });
      
      if (response.ok) {
        return response;
      }
      
      // Don't retry on 4xx errors (client errors)
      if (response.status >= 400 && response.status < 500) {
        throw new Error(`Client error: ${response.status} ${response.statusText}`);
      }
      
      // Retry on 5xx errors or network issues
      if (attempt === maxRetries) {
        throw new Error(`Server error after ${maxRetries + 1} attempts: ${response.status} ${response.statusText}`);
      }
      
    } catch (error) {
      if (attempt === maxRetries) {
        throw error;
      }
      
      // Wait before retrying (exponential backoff)
      const delay = Math.min(1000 * Math.pow(2, attempt), 10000);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

export async function optimizeRoute(coordinates, enableOptimization = true) {
  if (!coordinates || !Array.isArray(coordinates) || coordinates.length < 2) {
    console.error('Invalid coordinates provided for route optimization:', coordinates);
    return { coordinates: [], waypoints: [], dropOffOrder: [], distance: 0, duration: 0, optimized: false, usingFallback: true };
  }

  // Validate all coordinates are valid arrays of [longitude, latitude]
  const validCoordinates = coordinates.every(coord =>
    Array.isArray(coord) &&
    coord.length === 2 &&
    typeof coord[0] === 'number' &&
    typeof coord[1] === 'number' &&
    !isNaN(coord[0]) &&
    !isNaN(coord[1])
  );

  if (!validCoordinates) {
    console.error('Invalid coordinate format in array:', coordinates);
    return { coordinates: [], waypoints: [], dropOffOrder: [], distance: 0, duration: 0, optimized: false, usingFallback: true };
  }

  const [hqCoords, ...dropOffPoints] = coordinates;

  if (!MAPBOX_ACCESS_TOKEN) {
    console.warn('Mapbox token not available, using fallback route');
    return getFallbackRoute(hqCoords, dropOffPoints);
  }

  try {
    // Build ordering array — use optimization result when enabled, otherwise keep natural order
    let stopOrder = dropOffPoints.map((_, index) => index);

    if (enableOptimization && dropOffPoints.length > 1) {
      const optimizedOrder = getInitialOrder(hqCoords, dropOffPoints);

      if (optimizedOrder.length === dropOffPoints.length) {
        stopOrder = optimizedOrder;
      } else {
        console.warn('Failed to generate optimized order, using natural stop order instead');
      }
    }

    const orderedDropOffs = stopOrder.map(index => dropOffPoints[index]);

    // Format waypoints for the Directions API (HQ -> ordered drops -> HQ)
    const waypointsString = [
      `${hqCoords[0]},${hqCoords[1]}`,
      ...orderedDropOffs.map(coord => `${coord[0]},${coord[1]}`),
      `${hqCoords[0]},${hqCoords[1]}`
    ].join(';');

    // Get actual route using Mapbox Directions API with retry logic
    const directionsUrl = `https://api.mapbox.com/directions/v5/mapbox/driving/${waypointsString}?geometries=geojson&overview=full&access_token=${MAPBOX_ACCESS_TOKEN}`;

    const directionsResponse = await retryFetch(directionsUrl);
    const directionsData = await directionsResponse.json();

    if (directionsData.code !== 'Ok' || !directionsData.routes?.[0]?.geometry?.coordinates) {
      throw new Error(`Failed to get route from Mapbox, code: ${directionsData.code}`);
    }

    const route = directionsData.routes[0];

    // Create waypoints with proper ordering
    const waypoints = [
      { location: hqCoords, originalIndex: 0, newIndex: 0 },
      ...stopOrder.map((originalIndex, newIndex) => ({
        location: dropOffPoints[originalIndex],
        originalIndex: originalIndex + 1,
        newIndex: newIndex + 1
      })),
      { location: hqCoords, originalIndex: 0, newIndex: stopOrder.length + 1 }
    ];

    return {
      coordinates: route.geometry.coordinates,
      waypoints,
      dropOffOrder: stopOrder.map(i => i + 1),
      distance: route.distance, // Distance in meters
      duration: route.duration,  // Duration in seconds
      optimized: enableOptimization && stopOrder.some((value, index) => value !== index),
      usingFallback: false
    };

  } catch (error) {
    console.error('Error in route optimization, falling back to simple route:', error);
    return getFallbackRoute(hqCoords, dropOffPoints);
  }
}

// Helper function to generate fallback route when optimization fails
function getFallbackRoute(hqCoords, dropOffPoints) {
  try {
    // Calculate approximate distance and time for fallback
    let totalDistance = 0;
    let totalDuration = 0;
    const validRoute = [hqCoords, ...dropOffPoints, hqCoords];

    for (let i = 0; i < validRoute.length - 1; i++) {
      const dist = calculateDistance(validRoute[i], validRoute[i + 1]);
      if (dist === null) {
        return { coordinates: [], waypoints: [], dropOffOrder: [], distance: 0, duration: 0, optimized: false, usingFallback: true };
      }
      totalDistance += dist * 1000; // Convert km to meters
      totalDuration += (dist / 40) * 3600; // Assume average speed of 40 km/h
    }

    return {
      coordinates: validRoute,
      waypoints: validRoute.map((coord, index) => ({
        location: coord,
        originalIndex: index,
        newIndex: index
      })),
      dropOffOrder: dropOffPoints.map((_, i) => i + 1),
      distance: totalDistance,
      duration: totalDuration,
      optimized: false, // Flag to indicate fallback route
      usingFallback: true
    };
  } catch (fallbackError) {
    console.error('Error in fallback route generation:', fallbackError);
    return { coordinates: [], waypoints: [], dropOffOrder: [], distance: 0, duration: 0, optimized: false, usingFallback: true };
  }
}