import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// https://vitejs.dev/config/
export default defineConfig(() => {
  // We always run E2E against built preview; keep stable build settings
  const sourcemapSetting: true | 'inline' = true;
  const minifySetting: boolean | 'esbuild' = 'esbuild';

  return {
    plugins: [react()],
  // Allow override from env; default stays GH Pages path
    base: process.env.VITE_BASE_PATH ?? '/walkup_music/',
    build: {
      outDir: 'dist',
      sourcemap: sourcemapSetting,
      // Disable minification during coverage runs to improve source-map
      // fidelity in HTML reports (avoids odd mid-token highlights)
      minify: minifySetting,
    },
    define: {
      'import.meta.env.VITE_LOG_LEVEL': JSON.stringify(
        process.env.VITE_LOG_LEVEL ?? ''
      ),
      'import.meta.env.VITE_E2E_COVERAGE': JSON.stringify(''),
    },
    server: {
      port: 8000,
      open: true,
    },
    resolve: {
      alias: {
        '@': path.resolve(
          path.dirname(fileURLToPath(import.meta.url)),
          './src'
        ),
      },
    },
  };
});
