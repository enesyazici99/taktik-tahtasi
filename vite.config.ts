import { defineConfig } from 'vite';

// GitHub Pages: enesyazici99.github.io/taktik-tahtasi/
export default defineConfig({
  base: '/taktik-tahtasi/',
  build: {
    target: 'es2020',
    outDir: 'dist',
  },
});
