export interface AppConfig {
  basePath: string; // base path for the app (e.g., '/walkup_music' for GitHub Pages)
  logLevel?: 'debug' | 'info' | 'warn' | 'error' | 'silent';
  spotifyClientId: string;
  redirectUri: string;
  maxSegmentSeconds: number;
  tokenRefreshBufferMinutes: number; // minutes, default 15
  // Optional: cap token TTL. If provided, caps access token expiry and mock session lifetime
  maxTokenTtlSeconds?: number;
  mockAuth: boolean; // whether to use mock authentication for development/testing
}
