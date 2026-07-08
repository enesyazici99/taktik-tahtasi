import { defineConfig } from '@playwright/test';

// Sistemdeki Chrome kullanılır (indirme yok). dist derlenip önizlenir.
export default defineConfig({
  testDir: './e2e',
  timeout: 30000,
  fullyParallel: false,
  workers: 1,
  use: {
    baseURL: 'http://localhost:4188/taktik-tahtasi/',
    channel: 'chrome',
    headless: true,
    viewport: { width: 412, height: 915 },
  },
  webServer: {
    command: 'npm run build && npm run preview -- --port 4188 --strictPort',
    url: 'http://localhost:4188/taktik-tahtasi/',
    timeout: 120000,
    reuseExistingServer: false,
  },
});
