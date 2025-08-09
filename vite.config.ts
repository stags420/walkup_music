import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// https://vitejs.dev/config/
export default defineConfig(() => ({
  plugins: [react()],
  // Allow override from env; default stays GH Pages path
  base: process.env.VITE_BASE_PATH ?? '/walkup_music/',
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
  define: {
    'import.meta.env.VITE_LOG_LEVEL': JSON.stringify(process.env.VITE_LOG_LEVEL ?? ''),
    'import.meta.env.VITE_E2E_COVERAGE': JSON.stringify(process.env.VITE_E2E_COVERAGE ?? ''),
  },
  server: {
    port: 8000,
    open: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(path.dirname(fileURLToPath(import.meta.url)), './src'),
    },
  }
}));
