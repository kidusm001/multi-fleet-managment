# Mapbox Location Fix - Using Route's Location Instead of Hardcoded HQ

## Problem
The map component was hardcoding the HQ location from the `.env` file (via `HQ_LOCATION` config) for all routes, regardless of which location the route actually belonged to. This caused incorrect route visualization when routes were created for different locations (branches).

## Solution
Updated the system to dynamically use each route's `location` data (fetched through `locationId`) instead of the hardcoded HQ location.

## Files Changed

### 1. `packages/client/src/components/Common/Map/components/RouteLayer.jsx`
**Changes:**
- Now extracts location coordinates from `route.location` if available
- Falls back to `HQ_LOCATION.coords` only if route location is not available
- Uses `[route.location.longitude, route.location.latitude]` as the starting point for route optimization

**Code:**
```javascript
// Get route's location coordinates (HQ or branch), fallback to default HQ if not available
const startLocation = route.location?.longitude && route.location?.latitude
  ? [route.location.longitude, route.location.latitude]
  : HQ_LOCATION.coords;

// Get optimized route including start location
const optimizedRoute = await optimizeRoute([
  startLocation,
  ...route.coordinates,
], enableOptimization);
```

### 2. `packages/client/src/services/routeCalculationService.js`
**Changes:**
- Added optional `startLocation` parameter to `calculateRouteMetrics()`
- Uses provided start location or falls back to HQ_LOCATION
- Updated JSDoc to document the new parameter

**Signature:**
```javascript
export async function calculateRouteMetrics(coordinates, startLocation = null)
```

### 3. `packages/client/src/pages/RouteManagement/components/RouteManagementView/components/RouteDetailDrawer.jsx`
**Changes:**
- Updated all 3 calls to `calculateRouteMetrics()` to pass route's location coordinates
- Extracts location from `route.location` and passes as second parameter
- Ensures correct distance/time calculations based on actual route location

**Pattern:**
```javascript
// Get route's location coordinates
const startLocation = route.location?.longitude && route.location?.latitude
  ? [route.location.longitude, route.location.latitude]
  : null;

const metrics = await calculateRouteMetrics(coordinates, startLocation);
```

### 4. `packages/client/src/components/Common/Map/components/Markers.jsx`
**Changes:**
- Updated `HQMarker()` to accept optional `location` parameter
- Dynamically displays marker label as "HQ" or "Branch" based on location type
- Shows location name/address in popup instead of hardcoded "Routegna HQ"
- Uses provided location coordinates or falls back to default HQ_LOCATION

**Features:**
```javascript
export function HQMarker({ map, location = null }) {
  const markerLocation = location || HQ_LOCATION;
  el.innerHTML = markerLocation.type === 'BRANCH' ? "Branch" : "HQ";
  // ... popup shows location name and address
}
```

### 5. `packages/client/src/components/Common/Map/MapComponent.jsx`
**Changes:**
- Updated all 3 `HQMarker()` calls to pass `selectedRoute?.location`
- Ensures location marker displays correct information for each route
- Maintains backward compatibility when no route is selected

**Pattern:**
```javascript
const location = selectedRoute?.location;
hqMarkerRef.current = HQMarker({ 
  map: map.current,
  location: location
});
```

### 6. `packages/client/src/services/routeService.js`
**Changes:**
- Added `location` to the `include` parameter in all route queries:
  - `getAllRoutes()`: Now includes `'shuttle,shift,location,stops.employee.department'`
  - `getRoutesByShift()`: Now includes `'shuttle,location,stops.employee'`
  - `getRouteById()`: Now includes `'shuttle,shift,location,stops.employee.department'`
- Ensures route location data is always fetched from the API

## Benefits

1. **Correct Route Visualization**: Routes now display starting from their actual location (HQ or branch)
2. **Accurate Distance/Time Calculations**: Metrics calculated from correct starting point
3. **Better Multi-Location Support**: System properly handles routes for different branches/locations
4. **Dynamic Marker Labels**: Map markers show "HQ" or "Branch" based on location type
5. **Backward Compatible**: Falls back to default HQ location when route has no location assigned

## Database Schema Context

From `packages/server/prisma/schema.prisma`:

```prisma
model Route {
  locationId     String?
  location       Location?  @relation(fields: [locationId], references: [id])
  // ... other fields
}

model Location {
  id             String
  address        String?
  latitude       Float?
  longitude      Float?
  type           LocationType @default(BRANCH)
  // ... other fields
}
```

Each route can be associated with a location through `locationId`, and that location has its own coordinates.

## Coordinate Format

The system uses **GeoJSON format** for coordinates: `[longitude, latitude]`
- ✅ Correct: `[38.7994, 8.9779]` (Addis Ababa)
- ❌ Wrong: `[8.9779, 38.7994]` (would place it in Europe)

## Testing

To verify the fix:
1. Create routes for different locations (HQ and branches)
2. Check that the map centers on the correct location for each route
3. Verify that the location marker shows the correct label and address
4. Confirm that route calculations use the correct starting point

## Migration Notes

- No database migrations required
- Frontend-only changes
- Existing routes will work correctly if they have `locationId` set
- Routes without `locationId` will fall back to default HQ location
