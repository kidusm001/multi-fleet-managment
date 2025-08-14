import PropTypes from "prop-types";
import mapboxgl from "mapbox-gl";

import { optimizeRoute } from "../services/routeOptimization";
import { HQ_LOCATION } from "@/config";

// Helper function to check if map is ready
function isMapReady(map) {
  return map && map.getCanvas() && map.isStyleLoaded();
}

export async function addRouteLayer({ map, route }) {
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

    // Get optimized route including HQ
    const optimizedRoute = await optimizeRoute([
      HQ_LOCATION.coords,
      ...route.coordinates,
    ]);

    if (!optimizedRoute?.coordinates?.length) return null;

    // Verify map is still valid before adding new layers
    if (!isMapReady(map)) return null;

    // Add the route source and layer
    if (!map.getSource("route")) {
      map.addSource("route", {
        type: "geojson",
        data: {
          type: "Feature",
          properties: {},
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
          "line-color": "#4272FF",
          "line-width": 4,
          "line-opacity": 0.8,
        },
      });
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
