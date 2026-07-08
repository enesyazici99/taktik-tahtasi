import { defineConfig } from 'vitest/config';

// Vitest yalnızca src altındaki birim testlerini çalıştırır; e2e Playwright'a ait.
export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
    exclude: ['e2e/**', 'node_modules/**'],
  },
});
