import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
  host: 'localhost',
  strictPort: true,
  open: 'http://localhost:5173',
    proxy: {
      '/api': {
    target: 'http://localhost:3001',
        changeOrigin: true,
    secure: false,
    rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@pages': path.resolve(__dirname, './src/pages'),
      '@services': path.resolve(__dirname, './src/services'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@contexts': path.resolve(__dirname, './src/contexts'),
      '@data': path.resolve(__dirname, './src/data'),
      '@styles': path.resolve(__dirname, './src/styles'),
      '@lib': path.resolve(__dirname, './src/lib'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@constants': path.resolve(__dirname, './src/data/constants'),
      '@types': path.resolve(__dirname, './src/data/types'),
      '@assets': path.resolve(__dirname, './src/assets'),
      '@features': path.resolve(__dirname, './src/features'),
    },
  },
  worker: {
    format: 'es',
    plugins: () => [
      // ...existing plugins...
    ],
    rollupOptions: {
      external: [],
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          mapbox: ['mapbox-gl'],
          charts: ['recharts', 'chart.js'],
          motion: ['framer-motion'],
        }
      }
    }
  }
})