// External dependencies
import React from 'react';
import { createRoot } from 'react-dom/client';
import { Toaster } from 'sonner';

// Internal dependencies
import App from './App';
import ErrorBoundary from './components/Common/ErrorBoundary';
import './styles/index.css';

const root = createRoot(document.getElementById('root'));

// Allow disabling StrictMode in development to prevent double-invoked effects
const enableStrict = import.meta.env.PROD || import.meta.env.VITE_ENABLE_STRICT_MODE === 'true';

const AppTree = (
  <ErrorBoundary>
    <Toaster
      position="bottom-right"
      expand={true}
      richColors
      toastOptions={{
        duration: 3000,
        style: {
          background: 'var(--card-background, #ffffff)',
          color: 'var(--text-primary, #000000)',
          border: '1px solid var(--divider, #e5e7eb)'
        },
      }}
    />
    <App />
  </ErrorBoundary>
);

root.render(enableStrict ? <React.StrictMode>{AppTree}</React.StrictMode> : AppTree);