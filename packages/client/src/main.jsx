// External dependencies
import React from 'react';
import { createRoot } from 'react-dom/client';
import mapboxgl from 'mapbox-gl';

// Internal dependencies
import App from './App';
import ErrorBoundary from './components/Common/ErrorBoundary';
import './styles/index.css';

// Set Mapbox access token globally before any map components load
const mapboxToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
if (mapboxToken) {
  mapboxgl.accessToken = mapboxToken;
} else {
  console.error('VITE_MAPBOX_ACCESS_TOKEN environment variable is not set');
}

const root = createRoot(document.getElementById('root'));

// Allow disabling StrictMode in development to prevent double-invoked effects
const enableStrict = import.meta.env.PROD || import.meta.env.VITE_ENABLE_STRICT_MODE === 'true';

const AppTree = (
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);

root.render(enableStrict ? <React.StrictMode>{AppTree}</React.StrictMode> : AppTree);