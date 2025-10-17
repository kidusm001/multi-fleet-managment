export const MAP_STYLES = {
    light: import.meta.env.VITE_MAPBOX_LIGHT_STYLE,
    dark: import.meta.env.VITE_MAPBOX_DARK_STYLE
};

// Use environment variable for token
export const MAPBOX_ACCESS_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

export const MAP_CONFIG = {
    initialZoom: 12,
    maxZoom: 20,  // Increased from 16 to 20 for more detailed zoom capability
    minZoom: 10,
    pitch: 45,
    bearing: -9.6,
    padding: { top: 50, bottom: 50, left: 50, right: 50 },
    addisAbaba: {
        center: [38.7595, 9.0234],
        bounds: {
            north: 9.1213,
            south: 8.9046,
            east: 38.9077,
            west: 38.6532
        }
    }
};