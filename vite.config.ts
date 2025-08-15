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
    // Base path configuration:
    // - Vite requires trailing slash for proper asset resolution
    // - React Router basename should NOT have trailing slash (handled in detectBasePath)
    // - For local dev at root: VITE_BASE_PATH=/ 
    // - For GitHub Pages: /walkup_music/ (default)
    base: process.env.VITE_BASE_PATH ?? '/walkup_music',
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
      'import.meta.env.VITE_ENABLE_COVERAGE': JSON.stringify(''),
      'import.meta.env.VITE_MAX_SESSION_SECONDS': JSON.stringify(
        process.env.VITE_MAX_SESSION_SECONDS ?? ''
      ),
      'import.meta.env.VITE_APP_CONFIG_MODULE': JSON.stringify(
        process.env.VITE_APP_CONFIG_MODULE ?? ''
      ),
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
