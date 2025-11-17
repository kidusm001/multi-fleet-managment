import { getCachedHQLocation } from "@/services/hqLocationService";

function parseCoordinate(value) {
  if (typeof value === "string") {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return Number.isFinite(value) ? value : null;
}

function calculateDistance(origin, destination) {
  if (!Array.isArray(origin) || !Array.isArray(destination)) {
    return Number.POSITIVE_INFINITY;
  }

  const [lon1, lat1] = origin;
  const [lon2, lat2] = destination;

  if (
    !Number.isFinite(lon1) ||
    !Number.isFinite(lat1) ||
    !Number.isFinite(lon2) ||
    !Number.isFinite(lat2)
  ) {
    return Number.POSITIVE_INFINITY;
  }

  const toRadians = (deg) => (deg * Math.PI) / 180;
  const earthRadiusKm = 6371;
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const lat1Rad = toRadians(lat1);
  const lat2Rad = toRadians(lat2);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1Rad) * Math.cos(lat2Rad);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusKm * c;
}

export function resolveOriginCoordinates(route) {
  if (!route) {
    return getCachedHQLocation()?.coords ?? null;
  }

  const location = route?.location;

  if (Array.isArray(location?.coords) && location.coords.length === 2) {
    const [lon, lat] = location.coords;
    if (Number.isFinite(lon) && Number.isFinite(lat)) {
      return [lon, lat];
    }
  }

  const lon = parseCoordinate(location?.longitude);
  const lat = parseCoordinate(location?.latitude);

  if (Number.isFinite(lon) && Number.isFinite(lat)) {
    return [lon, lat];
  }

  return getCachedHQLocation()?.coords ?? null;
}

export function sortStopsBySequence(stops, originCoords = null) {
  if (!Array.isArray(stops) || stops.length === 0) {
    return [];
  }

  return buildGreedyStopOrder(stops, originCoords);
}

export function withOrderedStops(route) {
  if (!route) {
    return null;
  }

  const originCoords = resolveOriginCoordinates(route);
  const orderedStops = sortStopsBySequence(route.stops, originCoords);

  return {
    ...route,
    stops: orderedStops,
  };
}

function extractCoordinates(stop) {
  const longitude = stop?.longitude ?? stop?.stop?.longitude;
  const latitude = stop?.latitude ?? stop?.stop?.latitude;

  const lon = typeof longitude === "string" ? Number.parseFloat(longitude) : longitude;
  const lat = typeof latitude === "string" ? Number.parseFloat(latitude) : latitude;

  if (!Number.isFinite(lon) || !Number.isFinite(lat)) {
    return null;
  }

  return [lon, lat];
}

export function toMapStops(stops, originCoords = null) {
  const orderedStops = sortStopsBySequence(stops, originCoords);

  return orderedStops.reduce(
    (acc, stop, index) => {
      const displayNumber = index + 1;
      const coords = extractCoordinates(stop);
      if (!coords) {
        return acc;
      }

      acc.coordinates.push(coords);
      const area = stop.employee
        ? `${stop.employee.name}\n${stop.employee.location || ""}`
        : "Unassigned Stop";
      acc.areas.push(area);
      const employeeId = stop.employee?.userId;
      acc.employeeUserIds.push(employeeId == null ? null : String(employeeId));
      acc.stopNumbers.push(displayNumber);
      return acc;
    },
    { coordinates: [], areas: [], employeeUserIds: [], stopNumbers: [] }
  );
}

function buildGreedyStopOrder(stops, originCoords) {
  const coordinates = stops.map((stop) => extractCoordinates(stop));
  const visited = new Array(stops.length).fill(false);
  const orderedStops = [];

  const findNextIndex = (currentCoords) => {
    let nextIndex = -1;
    let minDistance = Number.POSITIVE_INFINITY;

    for (let index = 0; index < stops.length; index += 1) {
      if (visited[index]) {
        continue;
      }

      const candidateCoords = coordinates[index];
      const distance = calculateDistance(currentCoords, candidateCoords);

      if (distance < minDistance) {
        minDistance = distance;
        nextIndex = index;
      }
    }

    if (nextIndex === -1) {
      return visited.findIndex((value) => !value);
    }

    return nextIndex;
  };

  let currentCoords = originCoords;

  if (!currentCoords) {
    currentCoords = coordinates.find((coord) => Array.isArray(coord));
  }

  for (let count = 0; count < stops.length; count += 1) {
    const nextIndex = findNextIndex(currentCoords);

    if (nextIndex === -1 || visited[nextIndex]) {
      break;
    }

    orderedStops.push(stops[nextIndex]);
    visited[nextIndex] = true;

    if (Array.isArray(coordinates[nextIndex])) {
      currentCoords = coordinates[nextIndex];
    }
  }

  for (let index = 0; index < stops.length; index += 1) {
    if (!visited[index]) {
      orderedStops.push(stops[index]);
    }
  }

  return orderedStops;
}
