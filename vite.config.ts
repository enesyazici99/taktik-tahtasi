import { defineConfig } from 'vite';

// GitHub Pages: enesyazici99.github.io/taktik-tahtasi/
// Göreli base → hangi repo adına deploy edilirse edilsin (taktik-tahtasi,
// halisaha-taktik...) varlıklar doğru çözülür.
export default defineConfig({
  base: './',
  build: {
    target: 'es2020',
    outDir: 'dist',
  },
});
