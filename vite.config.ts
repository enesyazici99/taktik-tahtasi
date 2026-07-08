import { defineConfig } from 'vite';

// GitHub Pages: enesyazici99.github.io/taktik-tahtasi/ (repo adı: taktik-tahtasi).
// Mutlak base → hem Pages hem vite dev/preview /taktik-tahtasi/ altında çalışır.
export default defineConfig({
  base: '/taktik-tahtasi/',
  build: {
    target: 'es2020',
    outDir: 'dist',
  },
});
