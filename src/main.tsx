import { StrictMode } from 'react';
import ReactDOM from 'react-dom/client';
import { App } from '@/modules/app/components/App';
import { AppConfigProvider } from '@/modules/app';
import 'bootstrap/dist/css/bootstrap.min.css';
import '@/index.css';
import '@/theme.css';
// Application container removed; using suppliers for services

// Environment variables
const VITE_MOCK_AUTH = import.meta.env.VITE_MOCK_AUTH === 'true';
const VITE_SPOTIFY_CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID as
  | string
  | undefined;
const VITE_BASE_PATH =
  (import.meta.env.VITE_BASE_PATH as string | undefined) ?? undefined;

// Detect the base path based on the current location
const detectBasePath = (): string => {
  if (VITE_BASE_PATH !== undefined) {
    return VITE_BASE_PATH;
  }
  const currentPath = globalThis.location.pathname;
  // Check if we're running on GitHub Pages with /walkup_music/ base path
  if (currentPath.startsWith('/walkup_music/')) {
    return '/walkup_music';
  }
  // Default to no base path for local development
  return '';
};

// Get the current origin and convert localhost to 127.0.0.1 for Spotify compatibility
const getRedirectUri = (basePath = '') => {
  const origin = globalThis.location.origin;
  // Replace localhost with 127.0.0.1 as required by Spotify
  const spotifyCompatibleOrigin = origin.replace('localhost', '127.0.0.1');

  return `${spotifyCompatibleOrigin}${basePath}/callback`;
};

// Initialize global app configuration at startup
const initializeAppConfig = () => {
  const basePath = detectBasePath();

  // Mock auth is determined at build time via environment variable
  const mockAuth = VITE_MOCK_AUTH;

  const config = {
    maxSegmentDuration: 10,
    spotifyClientId: VITE_SPOTIFY_CLIENT_ID || 'REPLACE_ME_IN_.env.local',
    redirectUri: getRedirectUri(basePath),
    tokenRefreshBufferMinutes: 15,
    basePath,
    mockAuth,
  };

  AppConfigProvider.initialize(config);

  // No app container to initialize; suppliers will create services on demand
};

// Initialize configuration before rendering the app
initializeAppConfig();

// Initial theme is set by App effect based on settings

ReactDOM.createRoot(document.querySelector('#root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
