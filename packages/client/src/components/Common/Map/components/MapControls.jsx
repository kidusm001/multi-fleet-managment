import mapboxgl from "mapbox-gl";
import { MAP_CONFIG } from "../config";

/**
 * Configuration options for map controls
 * Centralized to ensure consistent behavior across all controls
 * @type {Object}
 */
const CONTROL_OPTIONS = {
  navigation: {
    showCompass: true,
    visualizePitch: true,
  },
  bounds: {
    padding: { top: 100, bottom: 100, left: 100, right: 100 },
    duration: 1000,
    maxZoom: MAP_CONFIG.maxZoom - 1,
    offset: [0, -25],
    essential: true,
    linear: true,
  },
  // 3D view settings with optimized parameters
  threeDView: {
    pitch: 60,
    bearing: -30, // Slight angle for better 3D perspective
    zoom: 17, // Higher zoom for better 3D effect
    duration: 1500, // Slightly reduced for better UX
    essential: true,
    easing: (t) => t * (2 - t), // Smooth easing function
  },
};

/**
 * Theme-aware styling for control buttons with improved alignment and contrast
 * Controls adapt to light/dark mode based on the theme context
 * @param {boolean} isDark - Whether dark mode is enabled
 * @returns {string} CSS rules for styling controls
 */
function getThemeStyles(isDark) {
  // Base colors with improved contrast for dark mode
  const darkBg = '#1e293b';         // Darker blue-gray for background
  const darkHoverBg = '#334155';    // Lighter for hover state
  const darkActiveBg = '#4272FF';   // Bright blue for active state
  const darkBorder = '#475569';     // Visible border in dark mode
  const darkIconColor = '#e2e8f0';  // Light gray for icons
  
  return `
    /* Control group container */
    .mapboxgl-ctrl-group {
      background: ${isDark ? darkBg : '#ffffff'};
      border-color: ${isDark ? darkBorder : 'rgba(0,0,0,0.1)'};
      border-radius: 8px;
      overflow: hidden;
      box-shadow: ${isDark ? 
        '0 4px 6px -1px rgba(0, 0, 0, 0.5), 0 2px 4px -1px rgba(0, 0, 0, 0.4)' : 
        '0 2px 4px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(0, 0, 0, 0.05)'};
    }
    
    /* Individual control buttons - better alignment */
    .mapboxgl-ctrl-group button {
      width: 32px;
      height: 32px;
      background-color: ${isDark ? darkBg : '#ffffff'};
      border: none;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background-color 0.2s ease, color 0.2s ease;
      position: relative;
      margin: 0;
      padding: 0;
    }
    
    /* Button hover states - improved interaction */
    .mapboxgl-ctrl-group button:hover {
      background-color: ${isDark ? darkHoverBg : '#f7f9fc'};
    }
    
    /* Button active & focus states */
    .mapboxgl-ctrl-group button:active,
    .mapboxgl-ctrl-group button:focus {
      outline: none;
      background-color: ${isDark ? '#2c3e50' : '#edf2f7'};
    }
    
    /* Custom button states */
    .mapboxgl-ctrl-group button.active {
      background-color: ${darkActiveBg};
    }
    
    /* Icon colors with better contrast */
    .mapboxgl-ctrl-group button svg,
    .mapboxgl-ctrl-group button .mapboxgl-ctrl-icon {
      color: ${isDark ? darkIconColor : '#374151'};
      opacity: ${isDark ? '0.9' : '0.75'};
      transition: opacity 0.2s ease;
    }
    
    .mapboxgl-ctrl-group button:hover svg,
    .mapboxgl-ctrl-group button:hover .mapboxgl-ctrl-icon {
      opacity: 1;
    }
    
    /* Active button icon styling */
    .mapboxgl-ctrl-group button.active svg,
    .mapboxgl-ctrl-group button.in-3d-mode svg {
      color: #ffffff;
      opacity: 1;
    }
    
    /* Divider between controls - for better visual separation */
    .mapboxgl-ctrl-group > button + button {
      border-top: ${isDark ? `1px solid ${darkBorder}` : '1px solid rgba(0,0,0,0.05)'};
    }
    
    /* Custom control button consistent sizing */
    .custom-control-button {
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      margin: 0;
      padding: 0;
    }
    
    .custom-control-button svg {
      width: 20px;
      height: 20px;
    }
    
    /* Improved animation for 3D mode transition */
    @keyframes gentle-pulse {
      0% { transform: scale(1); background-color: ${darkActiveBg}; }
      50% { transform: scale(1.05); background-color: ${isDark ? '#5580FF' : '#5580FF'}; }
      100% { transform: scale(1); background-color: ${darkActiveBg}; }
    }
    
    .mapboxgl-ctrl-group button.in-3d-mode {
      animation: gentle-pulse 3s infinite;
      background-color: ${darkActiveBg};
    }
    
    /* Fix for standard Mapbox controls in dark mode */
    .mapboxgl-ctrl-zoom-in .mapboxgl-ctrl-icon {
      background-image: url("data:image/svg+xml;charset=utf-8,%3Csvg width='29' height='29' viewBox='0 0 29 29' xmlns='http://www.w3.org/2000/svg' fill='${isDark ? '%23e2e8f0' : '%23333'}' %3E%3Cpath d='M14.5 8.5c-.75 0-1.5.75-1.5 1.5v3h-3c-.75 0-1.5.75-1.5 1.5S9.25 16 10 16h3v3c0 .75.75 1.5 1.5 1.5S16 19.75 16 19v-3h3c.75 0 1.5-.75 1.5-1.5S19.75 13 19 13h-3v-3c0-.75-.75-1.5-1.5-1.5z'/%3E%3C/svg%3E") !important;
    }
    
    .mapboxgl-ctrl-zoom-out .mapboxgl-ctrl-icon {
      background-image: url("data:image/svg+xml;charset=utf-8,%3Csvg width='29' height='29' viewBox='0 0 29 29' xmlns='http://www.w3.org/2000/svg' fill='${isDark ? '%23e2e8f0' : '%23333'}' %3E%3Cpath d='M10 13c-.75 0-1.5.75-1.5 1.5S9.25 16 10 16h9c.75 0 1.5-.75 1.5-1.5S19.75 13 19 13h-9z'/%3E%3C/svg%3E") !important;
    }
    
    .mapboxgl-ctrl-compass .mapboxgl-ctrl-icon {
      background-image: url("data:image/svg+xml;charset=utf-8,%3Csvg width='29' height='29' viewBox='0 0 29 29' xmlns='http://www.w3.org/2000/svg' fill='${isDark ? '%23e2e8f0' : '%23333'}' %3E%3Cpath d='M10.5 14l4-8 4 8h-8z'/%3E%3Cpath d='M10.5 16l4 8 4-8h-8z' fill='${isDark ? '%23e2e8f0' : '%23333'}'/%3E%3C/svg%3E") !important;
    }
    
    /* Fixed fullscreen button icons for better visibility */
    .mapboxgl-ctrl-fullscreen .mapboxgl-ctrl-icon {
      background-image: url("data:image/svg+xml;charset=utf-8,%3Csvg viewBox='0 0 14 14' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath fill='${isDark ? '%23e2e8f0' : '%23333'}' d='M2 9L0 9L0 14L5 14L5 12L2 12L2 9ZM0 5L2 5L2 2L5 2L5 0L0 0L0 5ZM12 12L9 12L9 14L14 14L14 9L12 9L12 12ZM9 0L9 2L12 2L12 5L14 5L14 0L9 0Z'/%3E%3C/svg%3E") !important;
      background-position: center !important;
      background-repeat: no-repeat !important;
      background-size: 16px !important; 
      width: 32px !important; 
      height: 32px !important;
      margin: 0 !important;
      padding: 0 !important;
    }
    
    /* Exit fullscreen icon with improved visibility */
    .mapboxgl-ctrl-shrink .mapboxgl-ctrl-icon {
      background-image: url("data:image/svg+xml;charset=utf-8,%3Csvg viewBox='0 0 14 14' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath fill='${isDark ? '%23e2e8f0' : '%23333'}' d='M2 0 L5 0 L5 2 L2 2 L2 5 L0 5 L0 0 L2 0 Z M12 0 L14 0 L14 5 L12 5 L12 2 L9 2 L9 0 L12 0 Z M12 14 L9 14 L9 12 L12 12 L12 9 L14 9 L14 14 L12 14 Z M2 14 L0 14 L0 9 L2 9 L2 12 L5 12 L5 14 L2 14 Z'/%3E%3C/svg%3E") !important;
      background-position: center !important;
      background-repeat: no-repeat !important;
      background-size: 16px !important;
      width: 32px !important;
      height: 32px !important;
      margin: 0 !important;
      padding: 0 !important;
    }
  `;
}

/**
 * Centers the map on the route or HQ location with performance optimizations
 * @param {Object} map - Mapbox GL JS map instance
 * @param {Object} currentRoute - Current route data
 */
function handleCenterClick(map, currentRoute, hqLocation) {
  if (!map || !map.loaded()) return;

  try {
    // Create bounds object only when needed
    const bounds = new mapboxgl.LngLatBounds();
    let hasValidBounds = false;

    const hqCoords = Array.isArray(hqLocation?.coords)
      ? hqLocation.coords
      : Number.isFinite(hqLocation?.longitude) && Number.isFinite(hqLocation?.latitude)
      ? [hqLocation.longitude, hqLocation.latitude]
      : null;

    // Center on route coordinates if available
    if (currentRoute?.coordinates?.length) {
      // Add HQ location first (if available)
      if (hqCoords) {
        bounds.extend(hqCoords);
        hasValidBounds = true;
      }

      // Add route coordinates - with validation to avoid errors
      currentRoute.coordinates.forEach((coord) => {
        if (Array.isArray(coord) && coord.length === 2 && 
            !isNaN(coord[0]) && !isNaN(coord[1])) {
          bounds.extend(coord);
          hasValidBounds = true;
        }
      });

      if (hasValidBounds) {
        // Use most efficient fitting method
        map.fitBounds(bounds, CONTROL_OPTIONS.bounds);
        return;
      }
    }

    // Default view if no valid route coordinates
    map.flyTo({
      center: hqCoords || MAP_CONFIG.addisAbaba.center,
      zoom: MAP_CONFIG.initialZoom - 0.5,
      duration: 1000,
      essential: true,
      pitch: 0, // Start with flat view for performance
      easing: (t) => t * (2 - t),
    });
  } catch (error) {
    console.warn("Center control error:", error);
  }
}

/**
 * Toggles the 3D view of the map with optimized terrain loading
 * @param {Object} map - Mapbox GL JS map instance
 * @param {HTMLElement} button - The button element for visual feedback
 */
function handle3DViewToggle(map, button, hqLocation) {
  if (!map || !map.loaded()) return;
  
  try {
    // Get current state
    const currentPitch = map.getPitch();
    const is3DActive = currentPitch > 0;
    
    if (is3DActive) {
      // Performance optimization: Remove terrain and sky when returning to 2D
      button.classList.remove('in-3d-mode');
      
      map.flyTo({
        pitch: 0,
        bearing: 0,
        zoom: MAP_CONFIG.initialZoom,
        duration: 1000,
        essential: true,
      });
      
      // Optional: Remove terrain for better performance in 2D mode
      if (map.getSource('mapbox-dem')) {
        // Wait for animation to complete before removing terrain
        setTimeout(() => {
          if (map.getLayer('sky')) {
            map.removeLayer('sky');
          }
          map.setTerrain(null);
        }, 1000);
      }
    } else {
      // Switch to 3D view focused on HQ
      button.classList.add('in-3d-mode');

      const hqCoords = Array.isArray(hqLocation?.coords)
        ? hqLocation.coords
        : Number.isFinite(hqLocation?.longitude) && Number.isFinite(hqLocation?.latitude)
        ? [hqLocation.longitude, hqLocation.latitude]
        : null;

      if (!hqCoords) {
        console.warn('3D view requires HQ coordinates, but none were provided.');
        return;
      }
      
      map.flyTo({
        center: hqCoords,
        ...CONTROL_OPTIONS.threeDView
      });
      
      // Add terrain if available and not already added - lazy loading approach
      const addTerrainWhenReady = () => {
        if (!map.getSource('mapbox-dem') && map.getStyle().glyphs?.includes('mapbox://')) {
          try {
            // Performance optimization: Load terrain with appropriate settings
            map.addSource('mapbox-dem', {
              'type': 'raster-dem',
              'url': 'mapbox://mapbox.mapbox-terrain-dem-v1',
              'tileSize': 512,
              'maxzoom': 14,
              'cache': true // Enable caching
            });
            
            // Apply terrain with moderate exaggeration
            map.setTerrain({ 'source': 'mapbox-dem', 'exaggeration': 1.5 });
            
            // Add sky layer for realistic 3D effect if not already present
            if (!map.getLayer('sky')) {
              map.addLayer({
                'id': 'sky',
                'type': 'sky',
                'paint': {
                  'sky-type': 'atmosphere',
                  'sky-atmosphere-sun': [0.0, 0.0],
                  'sky-atmosphere-sun-intensity': 15
                }
              });
            }
          } catch (err) {
            console.warn('Error adding terrain:', err);
          }
        }
      };
      
      // Wait for animation to partially complete before adding terrain
      // This improves perceived performance
      setTimeout(addTerrainWhenReady, 500);
    }
  } catch (error) {
    console.warn("3D view control error:", error);
    button.classList.remove('in-3d-mode');
  }
}

/**
 * Handle navigation to the next stop in 3D mode
 * @param {Object} map - Mapbox GL JS map instance
 * @param {Object} currentRoute - Current route data
 * @param {HTMLElement} button - The button element for visual feedback
 * @param {number} currentStopIndex - Current stop index being viewed
 * @returns {number} The next stop index
 */
function handleNextStop(map, currentRoute, button, currentStopIndex) {
  if (!map || !map.loaded() || !currentRoute?.coordinates?.length) return currentStopIndex;

  try {
    // Calculate next stop index, cycling back to HQ (0) after last stop
    const nextIndex = (currentStopIndex + 1) % currentRoute.coordinates.length;
    const nextCoord = currentRoute.coordinates[nextIndex];

    // Fly to next stop with 3D view settings
    map.flyTo({
      center: nextCoord,
      ...CONTROL_OPTIONS.threeDView,
    });

    // Visual feedback animation
    button.classList.add('active');
    setTimeout(() => button.classList.remove('active'), 500);

    return nextIndex;
  } catch (error) {
    console.warn("Next stop navigation error:", error);
    return currentStopIndex;
  }
}

/**
 * Adds navigation control (zoom and rotation) to the map
 * @param {Object} map - Mapbox GL JS map instance
 * @param {string} position - Control position
 * @param {boolean} isDark - Whether dark mode is enabled
 * @returns {Object} The added control
 */
export function addNavigationControl(map, position = "bottom-left", _isDark = false) {
  if (!map) return;
  
  // Apply theme styles - efficient DOM operations
  const styleId = 'mapbox-controls-style';
  let styleEl = document.getElementById(styleId);
  
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = styleId;
    document.head.appendChild(styleEl);
  }
  
  // Only update if necessary to avoid unnecessary reflows
  const newStyles = getThemeStyles(_isDark);
  if (styleEl.textContent !== newStyles) {
    styleEl.textContent = newStyles;
  }
  
  // Add navigation control
  const control = new mapboxgl.NavigationControl(CONTROL_OPTIONS.navigation);
  map.addControl(control, position);
  return control;
}

/**
 * Adds fullscreen control to the map with custom implementation
 * @param {Object} map - Mapbox GL JS map instance
 * @param {string} position - Control position
 * @returns {Object} The added control
 */
export function addFullscreenControl(map, position = "bottom-left") {
  if (!map) return;
  
  // Create a custom fullscreen control for better icon rendering
  class CustomFullscreenControl {
    onAdd(map) {
      this._map = map;
      this._container = document.createElement("div");
      this._container.className = "mapboxgl-ctrl mapboxgl-ctrl-group";
      
      // Create button with proper fullscreen SVG icon
      this._container.innerHTML = `
        <button 
          class="mapboxgl-ctrl-fullscreen" 
          type="button"
          title="Toggle fullscreen"
          aria-label="Toggle fullscreen mode"
        >
          <span class="mapboxgl-ctrl-icon" aria-hidden="true"></span>
        </button>
      `;

      this._fullscreenButton = this._container.querySelector('button');
      this._isFullscreen = false;
      
      this._clickHandler = () => {
        this.toggleFullscreen();
      };
      
      this._fullscreenChangeHandler = () => {
        const isFullscreen = this._isInFullscreen();
        this._isFullscreen = isFullscreen;
        this._updateButtonState();
      };
      
      // Add click listener
      this._fullscreenButton.addEventListener("click", this._clickHandler);
      
      // Listen for fullscreen change events from various browsers
      document.addEventListener('fullscreenchange', this._fullscreenChangeHandler);
      document.addEventListener('webkitfullscreenchange', this._fullscreenChangeHandler);
      document.addEventListener('mozfullscreenchange', this._fullscreenChangeHandler);
      document.addEventListener('MSFullscreenChange', this._fullscreenChangeHandler);
      
      return this._container;
    }
    
    toggleFullscreen() {
      if (this._isInFullscreen()) {
        this._exitFullscreen();
      } else {
        this._requestFullscreen();
      }
    }
    
    _isInFullscreen() {
      return !!(
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement ||
        document.msFullscreenElement
      );
    }
    
    _requestFullscreen() {
      const container = this._map.getContainer();
      
      if (container.requestFullscreen) {
        container.requestFullscreen();
      } else if (container.webkitRequestFullscreen) {
        container.webkitRequestFullscreen();
      } else if (container.mozRequestFullScreen) {
        container.mozRequestFullScreen();
      } else if (container.msRequestFullscreen) {
        container.msRequestFullscreen();
      }
    }
    
    _exitFullscreen() {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.mozCancelFullScreen) {
        document.mozCancelFullScreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      }
    }
    
    _updateButtonState() {
      const button = this._fullscreenButton;
      
      if (this._isFullscreen) {
        button.classList.add('mapboxgl-ctrl-shrink');
        button.classList.remove('mapboxgl-ctrl-fullscreen');
      } else {
        button.classList.add('mapboxgl-ctrl-fullscreen');
        button.classList.remove('mapboxgl-ctrl-shrink');
      }
    }
    
    onRemove() {
      // Clean up event listeners
      if (this._fullscreenButton) {
        this._fullscreenButton.removeEventListener("click", this._clickHandler);
      }
      
      document.removeEventListener('fullscreenchange', this._fullscreenChangeHandler);
      document.removeEventListener('webkitfullscreenchange', this._fullscreenChangeHandler);
      document.removeEventListener('mozfullscreenchange', this._fullscreenChangeHandler);
      document.removeEventListener('MSFullscreenChange', this._fullscreenChangeHandler);
      
      this._container.parentNode?.removeChild(this._container);
      this._map = null;
      this._container = null;
      this._fullscreenButton = null;
    }
  }

  const control = new CustomFullscreenControl();
  map.addControl(control, position);
  return control;
}

/**
 * Adds center control to the map with proper alignment and event handling
 * @param {Object} map - Mapbox GL JS map instance
 * @param {Object} currentRoute - Current route data
 * @param {string} position - Control position
 * @param {boolean} isDark - Whether dark mode is enabled
 * @returns {Object} The added control
 */
export function addCenterControl(map, currentRoute, hqLocation, position = "bottom-left", _isDark = false) {
  if (!map) return;

  class CustomCenterControl {
    onAdd(map) {
      this._container = document.createElement("div");
      this._container.className = "mapboxgl-ctrl mapboxgl-ctrl-group";
      
      // Clean SVG icon with proper viewBox and alignment
      this._container.innerHTML = `
        <button 
          class="mapboxgl-ctrl-icon custom-control-button" 
          type="button" 
          title="Center Map"
          aria-label="Center map on current route"
        >
          <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false">
            <path fill="currentColor" d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm8.94 3A8.994 8.994 0 0013 3.06V1h-2v2.06A8.994 8.994 0 003.06 11H1v2h2.06A8.994 8.994 0 0011 20.94V23h2v-2.06A8.994 8.994 0 0020.94 13H23v-2h-2.06zM12 19c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z"/>
          </svg>
        </button>
      `;

      // Performance optimized event handling with debounce
      this._button = this._container.querySelector('button');
      this._clickTimeout = null;
      
      // Use a proper event handler reference for cleanup
      this._handleClick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        // Debounce click handling
        clearTimeout(this._clickTimeout);
        this._clickTimeout = setTimeout(() => {
          this._button.classList.add('active');
          handleCenterClick(map, currentRoute, hqLocation);
          
          // Remove active state after a short delay
          setTimeout(() => this._button.classList.remove('active'), 500);
        }, 100);
      };
      
      this._button.addEventListener("click", this._handleClick);
      
      return this._container;
    }

    onRemove() {
      // Proper cleanup
      clearTimeout(this._clickTimeout);
      if (this._button) {
        this._button.removeEventListener("click", this._handleClick);
      }
      this._container.parentNode?.removeChild(this._container);
      this._button = null;
      this._handleClick = null;
      this._container = null;
    }
  }

  const control = new CustomCenterControl();
  map.addControl(control, position);
  return control;
}

/**
 * Adds 3D view control to the map with improved styling and accessibility
 * @param {Object} map - Mapbox GL JS map instance
 * @param {string} position - Control position 
 * @param {boolean} isDark - Whether dark mode is enabled
 * @returns {Object} The added control
 */
export function add3DViewControl(map, hqLocation, position = "bottom-left", _isDark = false) {
  if (!map) return;

  class Custom3DViewControl {
    onAdd(map) {
      this._map = map;
      this._container = document.createElement("div");
      this._container.className = "mapboxgl-ctrl mapboxgl-ctrl-group";
      
      // Create button with 3D cube icon and proper alignment
      this._container.innerHTML = `
        <button 
          id="map3DViewButton" 
          class="mapboxgl-ctrl-icon custom-control-button" 
          type="button" 
          title="Toggle 3D View"
          aria-label="Toggle map 3D view"
        >
          <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false">
            <path fill="currentColor" d="M21 16.5c0 .38-.21.71-.53.88l-7.9 4.44c-.16.12-.36.18-.57.18-.21 0-.41-.06-.57-.18l-7.9-4.44A.991.991 0 0 1 3 16.5v-9c0-.38.21-.71.53-.88l7.9-4.44c.16-.12.36-.18.57-.18.21 0 .41.06.57.18l7.9 4.44c.32.17.53.5.53.88v9M12 4.15L6.04 7.5 12 10.85l5.96-3.35L12 4.15z"/>
          </svg>
        </button>
      `;

      this._button = this._container.querySelector('#map3DViewButton');
      
      // Track state to prevent rapid clicking and animation conflicts
      this._isProcessingClick = false;
      
      // Proper event handler with reference for cleanup
      this._clickHandler = (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        // Throttle rapid clicks
        if (this._isProcessingClick) return;
        
        this._isProcessingClick = true;
        
        // Check current 3D state
        const is3DActive = map.getPitch() > 0;
        if (is3DActive) {
          this._button.setAttribute('aria-pressed', 'false');
        } else {
          this._button.setAttribute('aria-pressed', 'true');
        }
        
        // Toggle 3D view
        handle3DViewToggle(map, this._button, hqLocation);
        
        // Reset after animation completes
        setTimeout(() => {
          this._isProcessingClick = false;
        }, CONTROL_OPTIONS.threeDView.duration + 100);
      };
      
      // Add click listener
      this._button.addEventListener("click", this._clickHandler);
      
      // Set initial state
      const is3DActive = map.getPitch() > 0;
      this._button.setAttribute('aria-pressed', is3DActive ? 'true' : 'false');
      if (is3DActive) {
        this._button.classList.add('in-3d-mode');
      }
      
      return this._container;
    }

    onRemove() {
      // Proper cleanup
      if (this._button && this._clickHandler) {
        this._button.removeEventListener("click", this._clickHandler);
      }
      this._container.parentNode?.removeChild(this._container);
      this._button = null;
      this._clickHandler = null;
      this._container = null;
    }
  }

  const control = new Custom3DViewControl();
  map.addControl(control, position);
  return control;
}

/**
 * Adds next stop navigation control for 3D mode
 * @param {Object} map - Mapbox GL JS map instance
 * @param {Object} currentRoute - Current route data
 * @param {string} position - Control position
 * @returns {Object} The added control
 */
export function addNextStopControl(map, currentRoute, position = "bottom-left") {
  if (!map) return;

  class CustomNextStopControl {
    onAdd(map) {
      this._map = map;
      this._container = document.createElement("div");
      this._container.className = "mapboxgl-ctrl mapboxgl-ctrl-group";
      this._currentStopIndex = 0; // Start at HQ

      // Create button with next arrow icon
      this._container.innerHTML = `
        <button 
          id="mapNextStopButton" 
          class="mapboxgl-ctrl-icon custom-control-button" 
          type="button" 
          title="Next Stop"
          aria-label="Navigate to next stop"
          style="display: none;"
        >
          <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false">
            <path fill="currentColor" d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"/>
          </svg>
        </button>
      `;

      this._button = this._container.querySelector('#mapNextStopButton');
      
      // Show/hide button based on 3D mode state
      const updateButtonVisibility = () => {
        const is3DActive = map.getPitch() > 0;
        this._button.style.display = is3DActive ? 'flex' : 'none';
      };

      // Listen for pitch changes to show/hide button
      map.on('pitch', updateButtonVisibility);
      
      // Handle next stop navigation
      this._clickHandler = (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        if (map.getPitch() > 0) { // Only active in 3D mode
          this._currentStopIndex = handleNextStop(
            map,
            currentRoute,
            this._button,
            this._currentStopIndex
          );
        }
      };
      
      this._button.addEventListener("click", this._clickHandler);
      
      return this._container;
    }

    onRemove() {
      if (this._button && this._clickHandler) {
        this._button.removeEventListener("click", this._clickHandler);
      }
      this._container.parentNode?.removeChild(this._container);
      this._map = null;
      this._container = null;
      this._button = null;
    }
  }

  const control = new CustomNextStopControl();
  map.addControl(control, position);
  return control;
}
