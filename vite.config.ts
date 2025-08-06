import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    open: true, // Auto-open browser
    host: '0.0.0.0' // Allow network access
  },
  build: {
    outDir: 'dist',
    sourcemap: true // Enable sourcemaps for debugging
  }
});