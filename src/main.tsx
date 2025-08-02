import { StrictMode } from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import { AppConfigProvider } from '@/modules/config';
import 'bootstrap/dist/css/bootstrap.min.css';
import './index.css';

// Environment variables
const VITE_MOCK_AUTH = import.meta.env.VITE_MOCK_AUTH === 'true';

// Detect the base path based on the current location
const detectBasePath = (): string => {
  const currentPath = globalThis.location.pathname;
  // Check if we're running on GitHub Pages with /walkup_music/ base path
  if (currentPath.startsWith('/walkup_music/')) {
    return '/walkup_music';
  }
  // Default to no base path for local development
  return '';
};

// Get the current origin and convert localhost to 127.0.0.1 for Spotify compatibility
const getRedirectUri = (basePath: string = '') => {
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
    spotifyClientId: '7534de4cf2c14614846f1b0ca26a5400',
    redirectUri: getRedirectUri(basePath),
    tokenRefreshBufferMinutes: 15,
    basePath,
    mockAuth,
  };

  AppConfigProvider.initialize(config);
};

// Initialize configuration before rendering the app
initializeAppConfig();

// Apply dark theme to Bootstrap components
const applyDarkTheme = () => {
  const style = document.createElement('style');
  style.textContent = `
    /* Dark theme overrides for Bootstrap */
    :root {
      --bs-body-bg: #121212 !important;
      --bs-body-color: #ffffff !important;
      --bs-border-color: #2a2a2a !important;
      --bs-secondary-bg: #1a1a1a !important;
      --bs-tertiary-bg: #2a2a2a !important;
      --bs-emphasis-color: #ffffff !important;
      --bs-secondary-color: #b3b3b3 !important;
      --bs-muted-color: #808080 !important;
      --bs-link-color: #1db954 !important;
      --bs-link-hover-color: #1ed760 !important;
      --bs-primary: #1db954 !important;
      --bs-primary-rgb: 29, 185, 84 !important;
      --bs-secondary: #2a2a2a !important;
      --bs-secondary-rgb: 42, 42, 42 !important;
      --bs-success: #1db954 !important;
      --bs-success-rgb: 29, 185, 84 !important;
      --bs-info: #3b82f6 !important;
      --bs-info-rgb: 59, 130, 246 !important;
      --bs-warning: #f59e0b !important;
      --bs-warning-rgb: 245, 158, 11 !important;
      --bs-danger: #dc2626 !important;
      --bs-danger-rgb: 220, 38, 38 !important;
      --bs-light: #2a2a2a !important;
      --bs-light-rgb: 42, 42, 42 !important;
      --bs-dark: #121212 !important;
      --bs-dark-rgb: 18, 18, 18 !important;
    }

    /* Modal dark theme */
    .modal-content {
      background-color: #1a1a1a !important;
      border-color: #2a2a2a !important;
      color: #ffffff !important;
    }

    .modal-header {
      border-bottom-color: #2a2a2a !important;
      background-color: #1a1a1a !important;
    }

    .modal-footer {
      border-top-color: #2a2a2a !important;
      background-color: #1a1a1a !important;
    }

    /* Form controls dark theme */
    .form-control {
      background-color: #2a2a2a !important;
      border-color: #404040 !important;
      color: #ffffff !important;
    }

    .form-control:focus {
      background-color: #2a2a2a !important;
      border-color: #1db954 !important;
      color: #ffffff !important;
      box-shadow: 0 0 0 0.2rem rgba(29, 185, 84, 0.25) !important;
    }

    .form-label {
      color: #ffffff !important;
    }

    /* Card dark theme */
    .card {
      background-color: #2a2a2a !important;
      border-color: #404040 !important;
      color: #ffffff !important;
    }

    .card-body {
      background-color: #2a2a2a !important;
      color: #ffffff !important;
    }

    /* Alert dark theme */
    .alert-danger {
      background-color: #2d1b1b !important;
      border-color: #4a2a2a !important;
      color: #ff6b6b !important;
    }

    .alert-success {
      background-color: #1a2a1a !important;
      border-color: #2a4a2a !important;
      color: #1db954 !important;
    }

    /* Button dark theme overrides */
    .btn-outline-danger {
      color: #ff6b6b !important;
      border-color: #ff6b6b !important;
    }

    .btn-outline-danger:hover {
      background-color: #ff6b6b !important;
      color: #ffffff !important;
    }

    /* Text color overrides */
    .text-muted {
      color: #808080 !important;
    }

    /* Background overrides */
    body {
      background-color: #121212 !important;
      color: #ffffff !important;
    }
  `;
  document.head.append(style);
};

// Apply dark theme before rendering
applyDarkTheme();

ReactDOM.createRoot(document.querySelector('#root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
