import LocationService, { locationService } from "./locationService";

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

let cachedLocation = null;
let lastFetchedAt = 0;
let inFlightRequest = null;

const parseCoordinate = (value) => {
  if (value == null) {
    return null;
  }

  const parsed = typeof value === "string" ? Number.parseFloat(value) : value;
  return Number.isFinite(parsed) ? parsed : null;
};

const normalizeLocation = (rawLocation) => {
  if (!rawLocation) {
    return null;
  }

  const longitude = parseCoordinate(rawLocation.longitude);
  const latitude = parseCoordinate(rawLocation.latitude);

  return {
    id: rawLocation.id ?? null,
    address: rawLocation.address ?? null,
    type: rawLocation.type ?? LocationService.TYPES.HQ,
    organizationId: rawLocation.organizationId ?? null,
    longitude,
    latitude,
    coords:
      Number.isFinite(longitude) && Number.isFinite(latitude)
        ? [longitude, latitude]
        : null,
  };
};

const shouldUseCache = (forceRefresh = false) => {
  if (forceRefresh) {
    return false;
  }

  if (!cachedLocation) {
    return false;
  }

  return Date.now() - lastFetchedAt < CACHE_TTL_MS;
};

export const getCachedHQLocation = () => cachedLocation;

export const clearHQLocationCache = () => {
  cachedLocation = null;
  lastFetchedAt = 0;
  inFlightRequest = null;
};

export async function fetchHQLocation({ force = false } = {}) {
  if (shouldUseCache(force)) {
    return cachedLocation;
  }

  if (!force && inFlightRequest) {
    return inFlightRequest;
  }

  inFlightRequest = (async () => {
    try {
      const locations = await locationService.getLocations(LocationService.TYPES.HQ);
      const firstLocation = Array.isArray(locations) ? locations[0] : locations;
      const normalized = normalizeLocation(firstLocation);

      cachedLocation = normalized;
      lastFetchedAt = Date.now();
      return normalized;
    } finally {
      inFlightRequest = null;
    }
  })();

  return inFlightRequest;
}
