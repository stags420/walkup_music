import { StrictMode } from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import { appConfigProvider } from '@/modules/config';
import 'bootstrap/dist/css/bootstrap.min.css';
import './index.css';

// Get the current origin and convert localhost to 127.0.0.1 for Spotify compatibility
const getRedirectUri = () => {
  const origin = globalThis.location.origin;
  // Replace localhost with 127.0.0.1 as required by Spotify
  const spotifyCompatibleOrigin = origin.replace('localhost', '127.0.0.1');
  return `${spotifyCompatibleOrigin}/callback`;
};

// Initialize global app configuration at startup
const initializeAppConfig = () => {
  const config = {
    maxSegmentDuration: 10,
    spotifyClientId: '7534de4cf2c14614846f1b0ca26a5400',
    redirectUri: getRedirectUri(),
  };

  appConfigProvider.initialize(config);
};

// Initialize configuration before rendering the app
initializeAppConfig();

ReactDOM.createRoot(document.querySelector('#root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
