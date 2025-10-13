import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import PropTypes from "prop-types";
import { useTheme } from "@contexts/ThemeContext";
import debounce from "lodash/debounce";

import {
  MAP_CONFIG,
  MAP_STYLES,
  MAPBOX_ACCESS_TOKEN,
} from "./config";
import {
  addNavigationControl,
  addFullscreenControl,
  addCenterControl,
  add3DViewControl,
  addNextStopControl,
} from "./components/MapControls";
import { HQMarker, RouteMarkers } from "./components/Markers";
import { addRouteLayer } from "./components/RouteLayer";

// Configure mapbox with validation
if (!MAPBOX_ACCESS_TOKEN || MAPBOX_ACCESS_TOKEN === 'your_mapbox_access_token_here') {
  console.error('Mapbox access token is missing or invalid. Please check your .env file.');
}
// Note: mapboxgl.accessToken is now set globally in main.jsx

const FIT_BOUNDS_OPTIONS = {
  padding: { top: 100, bottom: 100, left: 100, right: 100 },
  duration: 1000,
  maxZoom: MAP_CONFIG.maxZoom - 1,
  linear: true,
};

// Helper function to wait for style to load
async function waitForStyleLoad(map) {
  if (!map || map.isStyleLoaded()) return;

  return new Promise((resolve) => {
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

function MapComponent({ selectedRoute, selectedShuttle, newStop, mapStyle, initialZoom, showDirections = false, enableOptimization = true, currentUserId = null }) {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const markersRef = useRef([]);
  const [mapInitialized, setMapInitialized] = useState(false);
  const [mapError, setMapError] = useState(null);
  const { theme } = useTheme();
  const isDark = useMemo(() => theme === 'dark', [theme]);
  const debouncedUpdateRoute = useRef(null);
  const hqMarkerRef = useRef(null);
  const controlsRef = useRef({
    navigation: null,
    fullscreen: null,
    center: null,
    threeD: null,
    nextStop: null, // Add reference for next stop control
  });

  // Define updateRoute first since it's used in other functions
  const updateRoute = useCallback(async () => {
    if (!map.current || !mapInitialized || !selectedRoute?.coordinates?.length)
      return;

    try {
      // Double-check map is still valid before proceeding
      if (!map.current) return;
      
      // Wait for style to be fully loaded
      await waitForStyleLoad(map.current);
      
      // Check again after async operation
      if (!map.current) return;

      // Remove existing markers
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];

      // Add route layer first
      const optimizedRoute = await addRouteLayer({
        map: map.current,
        route: selectedRoute,
        shuttle: selectedShuttle,
        enableOptimization,
      });

      // Check map is still valid after async operation
      if (!map.current) return;

      if (optimizedRoute) {
        // Add location marker (HQ or Branch) if not exists
        if (!hqMarkerRef.current && map.current) {
          // Pass the route's location if available
          const location = selectedRoute?.location;
          hqMarkerRef.current = HQMarker({ 
            map: map.current,
            location: location
          });
        }

        // Add route markers using RouteMarkers component
        const routeMarkers = RouteMarkers({
          map: map.current,
          route: {
            ...selectedRoute,
            // Use optimized coordinates and original areas for markers
            coordinates: optimizedRoute.waypoints
              .slice(1, -1)
              .map((wp) => wp.location),
            areas: optimizedRoute.waypoints
              .slice(1, -1)
              .map((wp) => selectedRoute.areas[wp.originalIndex]),
            // Pass employee user IDs for current user identification
            employeeUserIds: optimizedRoute.waypoints
              .slice(1, -1)
              .map((wp) => selectedRoute.employeeUserIds?.[wp.originalIndex]),
          },
          shuttle: selectedShuttle,
          currentUserId: currentUserId,
        });
        markersRef.current.push(...routeMarkers);

        // Add new stop marker if provided
        if (newStop?.latitude && newStop?.longitude) {
          const el = document.createElement("div");
          el.className = "drop-off-order new-stop";
          el.style.cssText = `
            background-color: #f97316;
            color: white;
            padding: 6px 10px;
            border-radius: 16px;
            font-size: 14px;
            font-weight: bold;
            border: 3px solid white;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
            cursor: pointer;
          `;
          el.innerHTML = "+";

          const popup = new mapboxgl.Popup({
            offset: 25,
            closeButton: false,
            className: "drop-off-popup",
            anchor: "bottom",
            focusAfterOpen: false,
          }).setHTML(`
            <div style="padding: 8px;">
              <div style="font-weight: bold;">New Stop</div>
              <div>${newStop.name}</div>
            </div>
          `);

          const marker = new mapboxgl.Marker({
            element: el,
            anchor: "center",
          })
            .setLngLat([newStop.longitude, newStop.latitude])
            .setPopup(popup)
            .addTo(map.current);

          // Handle click event to close other popups
          el.addEventListener("click", (e) => {
            e.stopPropagation();
            // Close other popups
            document
              .querySelectorAll(".mapboxgl-popup")
              .forEach((p) => p.remove());
          });

          markersRef.current.push(marker);
        }

        // Fit bounds to show all markers
        const bounds = new mapboxgl.LngLatBounds();
        optimizedRoute.coordinates.forEach((coord) => bounds.extend(coord));
        if (newStop) {
          bounds.extend([newStop.longitude, newStop.latitude]);
        }
        // Note: optimizedRoute.coordinates already includes the route's location as first coordinate
        map.current.fitBounds(bounds, FIT_BOUNDS_OPTIONS);
      } else if (showDirections) {
        // Verify map is still valid before proceeding
        if (!map.current) return;
        
        // Simple route display without optimization for dashboard view
        // Create a GeoJSON source for the route line
        if (map.current.getSource("route")) {
          map.current.removeSource("route");
        }
        if (map.current.getLayer("route")) {
          map.current.removeLayer("route");
        }

        // Add the route line
        map.current.addSource("route", {
          type: "geojson",
          data: {
            type: "Feature",
            properties: {},
            geometry: {
              type: "LineString",
              coordinates: selectedRoute.coordinates,
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
            "line-color": isDark ? "#4272FF" : "#6366F1",
            "line-width": 4,
            "line-opacity": 0.8,
          },
        });

        // Add markers for each stop
        selectedRoute.coordinates.forEach((coord, idx) => {
          // Create marker element
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

          // Create popup for marker
          const popup = new mapboxgl.Popup({
            offset: 25,
            closeButton: false,
            className: "drop-off-popup",
            focusAfterOpen: false,
            anchor: "bottom",
          }).setHTML(`
            <div style="padding: 8px;">
              <div style="font-weight: bold;">Drop-off Point ${idx + 1}</div>
              <div>${selectedRoute.areas[idx]}</div>
            </div>
          `);

          // Add marker to map
          const marker = new mapboxgl.Marker({
            element: el,
            anchor: "center",
          })
            .setLngLat(coord)
            .setPopup(popup)
            .addTo(map.current);

          // Close other popups when this one is clicked
          el.addEventListener("click", (e) => {
            e.stopPropagation();
            document
              .querySelectorAll(".mapboxgl-popup")
              .forEach((p) => p.remove());
            popup.addTo(map.current);
          });

          markersRef.current.push(marker);
        });

        // Add new stop marker if provided
        if (newStop?.latitude && newStop?.longitude) {
          const el = document.createElement("div");
          el.className = "drop-off-order new-stop";
          el.style.cssText = `
            background-color: #f97316;
            color: white;
            padding: 6px 10px;
            border-radius: 16px;
            font-size: 14px;
            font-weight: bold;
            border: 3px solid white;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
            cursor: pointer;
          `;
          el.innerHTML = "+";

          const popup = new mapboxgl.Popup({
            offset: 25,
            closeButton: false,
            className: "drop-off-popup",
            anchor: "bottom",
            focusAfterOpen: false,
          }).setHTML(`
            <div style="padding: 8px;">
              <div style="font-weight: bold;">New Stop</div>
              <div>${newStop.name}</div>
            </div>
          `);

          const marker = new mapboxgl.Marker({
            element: el,
            anchor: "center",
          })
            .setLngLat([newStop.longitude, newStop.latitude])
            .setPopup(popup)
            .addTo(map.current);

          // Handle click event to close other popups
          el.addEventListener("click", (e) => {
            e.stopPropagation();
            // Close other popups
            document
              .querySelectorAll(".mapboxgl-popup")
              .forEach((p) => p.remove());
          });

          markersRef.current.push(marker);
        }

        // Fit bounds to show all markers
        const bounds = new mapboxgl.LngLatBounds();
        selectedRoute.coordinates.forEach((coord) => bounds.extend(coord));
        if (newStop) {
          bounds.extend([newStop.longitude, newStop.latitude]);
        }
        map.current.fitBounds(bounds, FIT_BOUNDS_OPTIONS);
      } else {
        // No route selected, but check if we have a newStop to display
        if (newStop?.latitude && newStop?.longitude) {
          const el = document.createElement("div");
          el.className = "drop-off-order new-stop";
          el.style.cssText = `
            background-color: #f97316;
            color: white;
            padding: 6px 10px;
            border-radius: 16px;
            font-size: 14px;
            font-weight: bold;
            border: 3px solid white;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
            cursor: pointer;
          `;
          el.innerHTML = "+";

          const popup = new mapboxgl.Popup({
            offset: 25,
            closeButton: false,
            className: "drop-off-popup",
            anchor: "bottom",
            focusAfterOpen: false,
          }).setHTML(`
            <div style="padding: 8px;">
              <div style="font-weight: bold;">New Stop</div>
              <div>${newStop.name}</div>
            </div>
          `);

          const marker = new mapboxgl.Marker({
            element: el,
            anchor: "center",
          })
            .setLngLat([newStop.longitude, newStop.latitude])
            .setPopup(popup)
            .addTo(map.current);

          // Handle click event to close other popups
          el.addEventListener("click", (e) => {
            e.stopPropagation();
            // Close other popups
            document
              .querySelectorAll(".mapboxgl-popup")
              .forEach((p) => p.remove());
          });

          markersRef.current.push(marker);

          // Fit bounds to show the new stop marker
          const bounds = new mapboxgl.LngLatBounds();
          bounds.extend([newStop.longitude, newStop.latitude]);
          map.current.fitBounds(bounds, FIT_BOUNDS_OPTIONS);
        }
      }
    } catch (error) {
      console.error("Error updating route:", error);
      setMapError("Failed to update route");
    }
  }, [selectedRoute, selectedShuttle, mapInitialized, newStop, showDirections, isDark, enableOptimization, currentUserId]);

  // Add function to clean up controls
  const cleanupControls = useCallback(() => {
    if (map.current) {
      Object.values(controlsRef.current).forEach((control) => {
        if (control) {
          map.current.removeControl(control);
        }
      });
      controlsRef.current = {
        navigation: null,
        fullscreen: null,
        center: null,
        threeD: null,
        nextStop: null, // Reset next stop control reference
      };
    }
  }, []);

  // Add function to setup controls
  const setupControls = useCallback(() => {
    if (!map.current) return;

    cleanupControls();

    // Pass isDark to controls that need theme information
    controlsRef.current.navigation = addNavigationControl(map.current, "bottom-left", isDark);
    controlsRef.current.fullscreen = addFullscreenControl(map.current, "bottom-left");
    controlsRef.current.center = addCenterControl(map.current, selectedRoute, "bottom-left", isDark);
    controlsRef.current.threeD = add3DViewControl(map.current, "bottom-left", isDark);
    
    // Add next stop control for 3D navigation
    controlsRef.current.nextStop = addNextStopControl(map.current, selectedRoute, "bottom-left");
  }, [cleanupControls, selectedRoute, isDark]);

  // Function to handle style changes
  const handleNewStyle = useCallback(
    (center, zoom) => {
      if (!map.current) return;

      map.current.once("style.load", () => {
        // Check map is still valid after style load
        if (!map.current) return;
        
        // Restore view state
        map.current.setCenter(center);
        map.current.setZoom(zoom);

        // Re-add controls and route
        setupControls();
        if (hqMarkerRef.current && map.current) {
          const location = selectedRoute?.location;
          hqMarkerRef.current = HQMarker({ 
            map: map.current,
            location: location
          });
        }
        if (selectedRoute && map.current) {
          updateRoute();
        }
      });
    },
    [setupControls, selectedRoute, updateRoute]
  );

  // Performance optimized map initialization with proper style and terrain handling
  const initializeMap = useCallback(() => {
    if (!mapContainer.current || map.current) return;

    // Validate token before initializing (should already be set globally)
    if (!MAPBOX_ACCESS_TOKEN || MAPBOX_ACCESS_TOKEN === 'your_mapbox_access_token_here') {
      setMapError("Mapbox access token is not configured. Please contact your administrator.");
      console.error('Mapbox token not configured');
      return;
    }

    try {
      // Determine which style to use, prioritizing custom mapStyle prop
      const styleURL = mapStyle || (isDark ? MAP_STYLES.dark : MAP_STYLES.light);
      
      // Create map instance with optimized settings
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: styleURL,
        center: MAP_CONFIG.addisAbaba.center,
        zoom: initialZoom || MAP_CONFIG.initialZoom,
        minZoom: MAP_CONFIG.minZoom,
        maxZoom: MAP_CONFIG.maxZoom,
        pitch: 0,
        bearing: MAP_CONFIG.bearing,
        touchZoomRotate: true,
        attributionControl: false,
        // Performance optimizations
        preserveDrawingBuffer: false, // Improves performance
        antialias: true, // Better visual quality
        fadeDuration: 100, // Faster transitions
        renderWorldCopies: false, // Prevents rendering multiple world copies
        trackResize: true,
        terrain: false, // Only enable terrain when 3D mode is active
      });

      // Add load event listener
      map.current.once("load", () => {
        if (!map.current) return;
        
        // Set initialization flag and clear any errors
        setMapInitialized(true);
        setMapError(null);
        
        // Add controls to the map
        setupControls();
        
        // Add location marker (HQ or Branch)
        const location = selectedRoute?.location;
        hqMarkerRef.current = HQMarker({ 
          map: map.current,
          location: location
        });
        
        // Preconnect to Mapbox resources to improve performance
        const linkEl = document.createElement('link');
        linkEl.rel = 'preconnect';
        linkEl.href = 'https://api.mapbox.com';
        document.head.appendChild(linkEl);
        
        // If we have a route, update it
        if (selectedRoute) {
          updateRoute();
        }
      });

      // Add error handler with comprehensive error filtering
      map.current.on("error", (e) => {
        // Filter out common non-fatal errors and authentication errors
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
          // Only show error to user for critical issues
          if (!errorMessage.includes("token") && !errorMessage.includes("auth")) {
            setMapError("An error occurred while loading the map");
          }
        }
      });
    } catch (error) {
      console.error("Map initialization error:", error);
      const errorMsg = error?.message || 'Unknown error';
      if (errorMsg.includes('token') || errorMsg.includes('auth')) {
        setMapError("Invalid or expired Mapbox access token. Please contact your administrator.");
      } else {
        setMapError("Failed to initialize map. Please refresh the page.");
      }
    }
  }, [isDark, selectedRoute, updateRoute, setupControls, mapStyle, initialZoom]);

  // Initialize map
  useEffect(() => {
    // Create a lazy initialization function for better performance
    const lazyInitMap = () => {
      // Use requestIdleCallback or setTimeout as a fallback for optimal timing
      if ('requestIdleCallback' in window) {
        window.requestIdleCallback(initializeMap, { timeout: 2000 });
      } else {
        setTimeout(initializeMap, 100);
      }
    };
    
    lazyInitMap();
    
    return () => {
      if (map.current) {
        hqMarkerRef.current?.remove();
        cleanupControls();
        map.current.remove();
        map.current = null;
      }
    };
  }, [initializeMap, cleanupControls]);

  // Handle theme changes or custom style changes
  useEffect(() => {
    if (!map.current || !mapInitialized) return;

    // Only change style if there's no custom mapStyle provided
    if (!mapStyle) {
      const style = isDark ? MAP_STYLES.dark : MAP_STYLES.light;
      const center = map.current.getCenter();
      const zoom = map.current.getZoom();

      map.current.setStyle(style);
      map.current.once("style.load", () => {
        if (!map.current) return;
        map.current.setCenter(center);
        map.current.setZoom(zoom);
        setupControls();
        if (selectedRoute && map.current) {
          updateRoute();
        }
      });
    }
  }, [isDark, mapInitialized, setupControls, selectedRoute, updateRoute, mapStyle]);

  // Handle custom mapStyle changes
  useEffect(() => {
    if (!map.current || !mapInitialized || !mapStyle) return;
    
    const center = map.current.getCenter();
    const zoom = map.current.getZoom();
    
    map.current.setStyle(mapStyle);
    handleNewStyle(center, zoom);
  }, [mapStyle, mapInitialized, handleNewStyle]);

  // Update route when selected route changes - use debouncing for performance
  useEffect(() => {
    if (!map.current || !mapInitialized) return;
    
    if (!debouncedUpdateRoute.current) {
      debouncedUpdateRoute.current = debounce(() => {
        updateRoute();
      }, 300);
    }
    
    debouncedUpdateRoute.current();
    
    return () => {
      debouncedUpdateRoute.current?.cancel();
    };
  }, [selectedRoute, selectedShuttle, newStop, mapInitialized, updateRoute]);

  return (
    <div className="relative w-full h-full rounded-xl overflow-hidden">
      <div ref={mapContainer} className="w-full h-full" />
      {mapError && (
        <div className="absolute top-0 left-0 right-0 bg-red-500 text-white p-2 text-center">
          {mapError}
        </div>
      )}
    </div>
  );
}

MapComponent.propTypes = {
  selectedRoute: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    coordinates: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.number)),
    areas: PropTypes.arrayOf(PropTypes.string),
    dropOffOrder: PropTypes.arrayOf(PropTypes.number),
    employeeUserIds: PropTypes.arrayOf(PropTypes.string),
  }),
  selectedShuttle: PropTypes.any,
  newStop: PropTypes.shape({
    latitude: PropTypes.number,
    longitude: PropTypes.number,
    name: PropTypes.string,
  }),
  mapStyle: PropTypes.string,
  initialZoom: PropTypes.number,
  showDirections: PropTypes.bool,
  enableOptimization: PropTypes.bool,
  currentUserId: PropTypes.string,
};

export default MapComponent;
