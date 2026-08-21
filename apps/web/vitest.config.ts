import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

/**
 * Vitest configuration for React component and hook tests.
 *
 * WHY VITEST INSTEAD OF JEST FOR THE FRONTEND?
 * Vitest is built on top of Vite — it shares the same config, plugins,
 * and module resolution. This means:
 * - No separate babel config needed
 * - Tests run in the same environment as the dev server
 * - Significantly faster than Jest for Vite projects
 *
 * environment: 'jsdom' — simulates a browser DOM in Node.js.
 * React components need a DOM to render into.
 *
 * globals: true — makes describe(), it(), expect() available globally.
 * Without this you'd import them explicitly from 'vitest' in every test file.
 */
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/__tests__/setup.ts'],
  },
});
