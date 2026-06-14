import { defineConfig, type UserConfig } from 'vite';
import type { InlineConfig as VitestInlineConfig } from 'vitest/node';
import vue from '@vitejs/plugin-vue';
import { fileURLToPath, URL } from 'node:url';

// Vitest 2.x is typed against Vite 5 while this project runs on Vite 6, so the
// `test` field is typed explicitly here to keep `vue-tsc` happy without losing
// type safety on the Vitest options.
const config: UserConfig & { test: VitestInlineConfig } = {
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 5173,
    strictPort: false,
  },
  test: {
    globals: true,
    environment: 'jsdom',
    // Vitest only owns the unit/component specs under `src`. The Playwright E2E
    // specs live in `tests/e2e` and must never be collected by Vitest.
    include: ['src/**/*.{test,spec}.ts'],
    exclude: ['tests/e2e/**', '**/node_modules/**', '**/dist/**'],
  },
};

export default defineConfig(config);
