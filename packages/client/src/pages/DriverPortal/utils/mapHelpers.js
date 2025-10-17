import { resolveOriginCoordinates, toMapStops } from '../../Dashboard/utils/sortStops';

function toNumber(value, fallback) {
  const parsed = typeof value === 'string' ? Number.parseFloat(value) : value;
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function transformRouteForMap(route) {
  if (!route?.stops || route.stops.length === 0) {
    return null;
  }

  const originCoords = resolveOriginCoordinates(route);
  const mapStops = toMapStops(route.stops, originCoords);

  if (!mapStops.coordinates.length) {
    return null;
  }

  const fallbackOrigin = Array.isArray(originCoords) && originCoords.length === 2
    ? originCoords
    : mapStops.coordinates[0];

  if (!Array.isArray(fallbackOrigin) || fallbackOrigin.length !== 2) {
    return null;
  }

  const hasLocationCoords = Array.isArray(route?.location?.coords) && route.location.coords.length === 2;
  const locationCoords = hasLocationCoords ? route.location.coords : fallbackOrigin;

  const sanitizedLocation = route.location
    ? {
        ...route.location,
        coords: locationCoords,
        longitude: toNumber(route.location.longitude, locationCoords[0]),
        latitude: toNumber(route.location.latitude, locationCoords[1]),
        type: route.location?.type || 'HQ',
      }
    : {
        coords: fallbackOrigin,
        longitude: fallbackOrigin[0],
        latitude: fallbackOrigin[1],
        type: 'HQ',
      };

  return {
    id: route.id,
    coordinates: mapStops.coordinates,
    areas: mapStops.areas,
    employeeUserIds: mapStops.employeeUserIds,
    stopNumbers: mapStops.stopNumbers,
    originalStopIndices: mapStops.stopNumbers.map((_, index) => index),
    location: sanitizedLocation,
  };
}

export function buildGoogleMapsUrl(mapRoute) {
  if (!mapRoute?.coordinates?.length) {
    return null;
  }

  const origin = Array.isArray(mapRoute.location?.coords) && mapRoute.location.coords.length === 2
    ? mapRoute.location.coords
    : mapRoute.coordinates[0];

  const destination = mapRoute.coordinates[mapRoute.coordinates.length - 1];
  const waypoints = mapRoute.coordinates.slice(0, -1);

  const params = new URLSearchParams({ api: '1', travelmode: 'driving' });
  params.set('origin', `${origin[1]},${origin[0]}`);
  params.set('destination', `${destination[1]},${destination[0]}`);

  if (waypoints.length) {
    const waypointStrings = waypoints.map(([longitude, latitude]) => `${latitude},${longitude}`);
    params.set('waypoints', waypointStrings.join('|'));
  }

  return `https://www.google.com/maps/dir/?${params.toString()}`;
}
