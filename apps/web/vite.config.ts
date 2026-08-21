import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

/**
 * Vite configuration for the React frontend.
 *
 * WHAT VITE DOES:
 * Vite is a build tool and dev server. In development it serves files
 * using native ES modules (no bundling needed — extremely fast).
 * In production it bundles everything with Rollup.
 *
 * THE PROXY:
 * In development, the browser considers localhost:5173 and localhost:5000
 * as different "origins". Normally this triggers CORS. The proxy tells Vite:
 * "any request starting with /api, forward it to localhost:5000".
 * From the browser's perspective, it's talking to the same origin.
 *
 * This means chatService.ts can use relative URLs like '/api/chat'
 * instead of hardcoding 'http://localhost:5000/api/chat'.
 *
 * NOTE: The backend also has CORS enabled for robustness (e.g., Postman testing).
 */
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
});
