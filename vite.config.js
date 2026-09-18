import { defineConfig } from 'vite';

/**
 * The game is meant to be dropped into a folder on the host platform, e.g.
 * /games/stickman-runner/, so all asset URLs are relative.
 */
export default defineConfig({
  base: './',
  build: {
    target: 'es2019',
    outDir: 'dist',
    assetsDir: 'assets',
    cssCodeSplit: false,
    rollupOptions: {
      output: {
        entryFileNames: 'assets/[name].[hash].js'
      }
    }
  },
  server: {
    port: 5173,
    open: false
  }
});
