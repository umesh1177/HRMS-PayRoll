/**
 * Vite Configuration File
 * 
 * RESPONSIBILITY:
 * Configures the build and development environment for the React SPA,
 * including plugin hooks for JSX transformation and dev server options.
 * 
 * NOT RESPONSIBLE FOR:
 * Runtime routing, application state, or API endpoints.
 */

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: true
  }
});
