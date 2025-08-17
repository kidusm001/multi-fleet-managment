import { useEffect, useRef } from "react";
import PropTypes from "prop-types";
import mapboxgl from "mapbox-gl";
import { MAPBOX_ACCESS_TOKEN } from "@data/routeAssignmentData";
import "mapbox-gl/dist/mapbox-gl.css";

mapboxgl.accessToken = MAPBOX_ACCESS_TOKEN;

function Map({ selectedRoute, showDirections = false }) {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const markersRef = useRef([]);

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

    // Initialize map if it doesn't exist
    if (!map.current) {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: "mapbox://styles/mapbox/dark-v11",
        center: center,
        zoom: 12,
      });
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

      // Add markers for each stop
      selectedRoute.stops.forEach((stop, idx) => {
        const lat = stop.latitude || stop.stop?.latitude;
        const lng = stop.longitude || stop.stop?.longitude;
        if (!lat || !lng) return;

        const el = document.createElement("div");
        el.className = "marker";
        el.style.width = "24px";
        el.style.height = "24px";
        el.style.backgroundImage =
          "url(https://docs.mapbox.com/mapbox-gl-js/assets/custom_marker.png)";
        el.style.backgroundSize = "cover";
        el.style.borderRadius = "50%";
        el.style.border = "2px solid #fff";
        el.style.boxShadow = "0 2px 4px rgba(0,0,0,0.2)";
        el.style.cursor = "pointer";

        const marker = new mapboxgl.Marker(el)
          .setLngLat([lng, lat])
          .setPopup(
            new mapboxgl.Popup({ offset: 25 }).setHTML(`
              <div class="p-3 min-w-[200px]">
                <h3 class="font-medium text-base mb-1">${
                  stop.location || stop.name
                }</h3>
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
    <div className="bg-card rounded-2xl overflow-hidden shadow-sm">
      <div ref={mapContainer} className="h-[500px] rounded-xl" />
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
