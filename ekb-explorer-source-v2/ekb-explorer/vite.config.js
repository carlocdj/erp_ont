import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Using relative base so the build can be served from any subpath
// (GitHub Pages, nested S3, etc.) without reconfiguration.
export default defineConfig({
  plugins: [react()],
  base: './',
  server: {
    host: true,
    port: 5173,
  },
  build: {
    outDir: 'dist',
    assetsInlineLimit: 4096,
    sourcemap: false,
  },
});
