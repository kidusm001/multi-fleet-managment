import { useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";
import mapboxgl from "mapbox-gl";
import { MAPBOX_ACCESS_TOKEN } from "@data/routeAssignmentData";
import "mapbox-gl/dist/mapbox-gl.css";

// Configure mapbox with validation
if (!MAPBOX_ACCESS_TOKEN || MAPBOX_ACCESS_TOKEN === 'your_mapbox_access_token_here') {
  console.error('Mapbox access token is missing or invalid. Please check your .env file.');
}
mapboxgl.accessToken = MAPBOX_ACCESS_TOKEN || '';

function Map({ selectedRoute, showDirections = false }) {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const markersRef = useRef([]);
  const [mapError, setMapError] = useState(null);

  useEffect(() => {
    if (
      !selectedRoute ||
      !selectedRoute.stops ||
      selectedRoute.stops.length === 0
    )
      return;

    const coordinates = selectedRoute.stops
      .map((stop) => [
        stop.longitude || stop.stop?.longitude,
        stop.latitude || stop.stop?.latitude,
      ])
      .filter((coord) => coord[0] && coord[1]); // Filter out invalid coordinates

    if (coordinates.length === 0) return;

    const center = coordinates[0];

    // Validate token before initializing
    if (!MAPBOX_ACCESS_TOKEN || MAPBOX_ACCESS_TOKEN === 'your_mapbox_access_token_here') {
      setMapError("Mapbox access token not configured");
      return;
    }

    // Initialize map if it doesn't exist
    if (!map.current) {
      try {
        map.current = new mapboxgl.Map({
          container: mapContainer.current,
          style: "mapbox://styles/mapbox/dark-v11",
          center: center,
          zoom: 12,
        });

        // Add error handler
        map.current.on("error", (e) => {
          const errorMessage = e.error?.message || e.message || '';
          const ignoredErrors = [
            "source with ID",
            "does not exist in the map's style",
            "layer is not currently visible",
            "errorCb is not a function",
            "Failed to fetch",
            "NetworkError"
          ];
          
          const shouldIgnore = ignoredErrors.some(err => errorMessage.includes(err));
          
          if (!shouldIgnore) {
            console.error("Mapbox error:", e);
          }
        });
      } catch (error) {
        console.error("Map initialization error:", error);
        setMapError("Failed to initialize map");
        return;
      }
    } else {
      // If map exists, update the center
      map.current.setCenter(center);
    }

    // Clean up previous markers
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    // Function to add route and markers
    const addRouteAndMarkers = () => {
      // Remove existing route layer and source if they exist
      if (map.current.getLayer("route")) map.current.removeLayer("route");
      if (map.current.getSource("route")) map.current.removeSource("route");

      // Add new route if showDirections is true
      if (showDirections) {
        map.current.addSource("route", {
          type: "geojson",
          data: {
            type: "Feature",
            properties: {},
            geometry: {
              type: "LineString",
              coordinates: coordinates,
            },
          },
        });

        map.current.addLayer({
          id: "route",
          type: "line",
          source: "route",
          layout: {
            "line-join": "round",
            "line-cap": "round",
          },
          paint: {
            "line-color": "#6366F1",
            "line-width": 4,
            "line-opacity": 0.8,
          },
        });
      }

      // Add numbered markers for each stop
      selectedRoute.stops.forEach((stop, idx) => {
        const lat = stop.latitude || stop.stop?.latitude;
        const lng = stop.longitude || stop.stop?.longitude;
        if (!lat || !lng) return;

        // Create numbered marker element
        const el = document.createElement("div");
        el.className = "drop-off-order";
        el.style.cssText = `
          background-color: #4272FF;
          color: white;
          padding: 6px 10px;
          border-radius: 16px;
          font-size: 14px;
          font-weight: bold;
          border: 3px solid white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
          z-index: 1;
          cursor: pointer;
        `;
        el.innerHTML = (idx + 1).toString();

        const marker = new mapboxgl.Marker({
          element: el,
          anchor: "center",
        })
          .setLngLat([lng, lat])
          .setPopup(
            new mapboxgl.Popup({ offset: 25, closeButton: false, className: "drop-off-popup" }).setHTML(`
              <div class="p-3 min-w-[200px]">
                <h3 class="font-medium text-base mb-1">Stop ${idx + 1}</h3>
                <p class="text-sm mb-1">${stop.location || stop.name}</p>
                ${
                  idx === 0
                    ? '<span class="text-xs px-2 py-1 bg-primary/10 text-primary rounded-full">Starting Point</span>'
                    : ""
                }
                ${
                  stop.employee
                    ? `<p class="text-sm text-muted-foreground mt-1">${stop.employee.name}</p>`
                    : ""
                }
              </div>
            `)
          )
          .addTo(map.current);

        // Handle click event to close other popups
        el.addEventListener("click", (e) => {
          e.stopPropagation();
          document.querySelectorAll(".mapboxgl-popup").forEach((p) => p.remove());
        });

        markersRef.current.push(marker);
      });

      // Fit bounds to show all markers
      const bounds = coordinates.reduce((bounds, coord) => {
        return bounds.extend(coord);
      }, new mapboxgl.LngLatBounds(coordinates[0], coordinates[0]));

      map.current.fitBounds(bounds, {
        padding: 50,
        duration: 1000,
      });
    };

    // Add route and markers when map is loaded
    if (map.current.loaded()) {
      addRouteAndMarkers();
    } else {
      map.current.on("load", addRouteAndMarkers);
    }

    return () => {
      // Cleanup function
      if (map.current) {
        if (map.current.getLayer("route")) map.current.removeLayer("route");
        if (map.current.getSource("route")) map.current.removeSource("route");
        markersRef.current.forEach((marker) => marker.remove());
        markersRef.current = [];
      }
    };
  }, [selectedRoute, showDirections]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  return (
    <div className="bg-card rounded-2xl overflow-hidden shadow-sm relative">
      <div ref={mapContainer} className="h-[500px] rounded-xl" />
      {mapError && (
        <div className="absolute top-0 left-0 right-0 bg-red-500 text-white p-2 text-center text-sm">
          {mapError}
        </div>
      )}
    </div>
  );
}

Map.propTypes = {
  selectedRoute: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    stops: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        location: PropTypes.string,
        name: PropTypes.string,
        latitude: PropTypes.number,
        longitude: PropTypes.number,
        stop: PropTypes.shape({
          latitude: PropTypes.number,
          longitude: PropTypes.number,
        }),
        employee: PropTypes.shape({
          id: PropTypes.string,
          name: PropTypes.string,
        }),
      })
    ),
  }),
  showDirections: PropTypes.bool,
};

export default Map;
