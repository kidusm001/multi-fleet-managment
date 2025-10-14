import PropTypes from "prop-types";

import { optimizeRoute } from "../services/routeOptimization";
import { HQ_LOCATION } from "@/config";

// Helper function to check if map is ready
function isMapReady(map) {
  return map && map.getCanvas() && map.isStyleLoaded();
}

export async function addRouteLayer({ map, route, enableOptimization = true }) {
  if (!route?.coordinates?.length || !map) return null;

  try {
    // Wait for style to be loaded
    if (!map.isStyleLoaded()) {
      await new Promise((resolve) => {
        const checkStyle = () => {
          if (map.isStyleLoaded()) {
            resolve();
          } else {
            requestAnimationFrame(checkStyle);
          }
        };
        checkStyle();
      });
    }

    // Verify map is still valid after waiting
    if (!isMapReady(map)) return null;

    // Clean up existing layers and sources
    await removeRouteLayer(map);

    // Get route's location coordinates (HQ or branch), fallback to default HQ if not available
    const startLocation = route.location?.longitude && route.location?.latitude
      ? [route.location.longitude, route.location.latitude]
      : HQ_LOCATION.coords;

    // Get optimized route including start location
    const optimizedRoute = await optimizeRoute([
      startLocation,
      ...route.coordinates,
    ], enableOptimization);

    if (!optimizedRoute?.coordinates?.length) return null;

    // Verify map is still valid before adding new layers
    if (!isMapReady(map)) return null;

    // Determine route color based on optimization status
  const routeColor = optimizedRoute.usingFallback ? "#FFA500" : "#4272FF"; // Blue for API routes, Orange for fallback

    // Add the route source and layer
    if (!map.getSource("route")) {
      map.addSource("route", {
        type: "geojson",
        data: {
          type: "Feature",
          properties: {
            optimized: optimizedRoute.optimized || false
          },
          geometry: {
            type: "LineString",
            coordinates: optimizedRoute.coordinates,
          },
        },
      });
    }

    if (!map.getLayer("route")) {
      map.addLayer({
        id: "route",
        type: "line",
        source: "route",
        layout: {
          "line-join": "round",
          "line-cap": "round",
        },
        paint: {
          "line-color": routeColor,
          "line-width": 4,
          "line-opacity": 0.8,
        },
      });
    }

    // Log optimization status for user feedback
    if (optimizedRoute.usingFallback) {
      console.warn("Route optimization failed, showing fallback route. Check Mapbox configuration.");
    }

    // Return optimized route data for marker placement
    return optimizedRoute;
  } catch (error) {
    console.error("Error adding route layer:", error);
    return null;
  }
}

export function removeRouteLayer(map) {
  if (!isMapReady(map)) return;

  try {
    // Remove route layer and source with proper checks
    if (map.getLayer("route")) {
      map.removeLayer("route");
    }
    if (map.getSource("route")) {
      map.removeSource("route");
    }
  } catch (error) {
    console.warn("Error during route cleanup:", error);
  }
}

addRouteLayer.propTypes = {
  map: PropTypes.object.isRequired,
  route: PropTypes.shape({
    coordinates: PropTypes.arrayOf(
      PropTypes.arrayOf(PropTypes.number.isRequired)
    ).isRequired,
    areas: PropTypes.arrayOf(PropTypes.string.isRequired).isRequired,
  }).isRequired,
};
