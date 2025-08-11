/// <reference types="vite/client" />

// Augment ImportMetaEnv with the VITE_ variables used in this project
// See: https://vite.dev/guide/env-and-mode

interface ViteTypeOptions {
  // Enforce strict typing: disallow unknown env keys on import.meta.env
  strictImportMetaEnv: unknown;
}

interface ImportMetaEnv {
  readonly VITE_SPOTIFY_CLIENT_ID?: string;
  readonly VITE_BASE_PATH?: string;
  readonly VITE_MOCK_AUTH?: 'true' | 'false';
  readonly VITE_LOG_LEVEL?: 'debug' | 'info' | 'warn' | 'error' | 'silent';
  readonly VITE_E2E_COVERAGE?: 'true' | 'false';
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
