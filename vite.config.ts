import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

/**
 * VOID_WEAVER // VITE_BUILD_MANIFEST
 * HARDWARE: APPLE_M2_SILICON_OPTIMIZED
 * VERSION: 3.2.1
 */
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  base: './',
  build: {
    outDir: 'dist',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          state: ['zustand'],
        },
      },
    },
  },
  server: {
    port: 5173,
    strictPort: true,
  }
});