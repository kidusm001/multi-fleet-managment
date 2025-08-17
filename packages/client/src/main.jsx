// External dependencies
import React from 'react';
import { createRoot } from 'react-dom/client';
import { Toaster } from 'sonner';

// Internal dependencies
import App from './App';  // Change to default import
import './styles/index.css';

const root = createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
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
  </React.StrictMode>
);