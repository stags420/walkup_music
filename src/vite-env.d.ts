/// <reference types="vite/client" />

// Augment ImportMetaEnv with the VITE_ variables used in this project
// See: https://vite.dev/guide/env-and-mode

interface ViteTypeOptions {
  // Enforce strict typing: disallow unknown env keys on import.meta.env
  strictImportMetaEnv: unknown;
}

interface ImportMetaEnv {
  readonly VITE_SPOTIFY_CLIENT_ID?: string;
  readonly VITE_APP_CONFIG_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
