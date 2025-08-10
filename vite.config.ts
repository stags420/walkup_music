import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// https://vitejs.dev/config/
export default defineConfig(() => {
  const enableE2eCoverage = Boolean(process.env.VITE_E2E_COVERAGE);

  const sourcemapSetting: true | 'inline' = enableE2eCoverage ? 'inline' : true;
  const minifySetting: boolean | 'esbuild' = enableE2eCoverage ? false : 'esbuild';

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
      'import.meta.env.VITE_E2E_COVERAGE': JSON.stringify(
        process.env.VITE_E2E_COVERAGE ?? ''
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
