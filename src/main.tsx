import { StrictMode } from 'react';
import ReactDOM from 'react-dom/client';
import { App } from '@/modules/app/components/App';
import { AppConfigSupplier } from '@/modules/app';
import { buildDefaultAppConfig } from '@/defaultAppConfig';
import 'bootstrap/dist/css/bootstrap.min.css';
import '@/index.css';
import '@/theme.css';
// Application container removed; using suppliers for services

const initializeAppConfig = () => {
  const config = buildDefaultAppConfig();
  AppConfigSupplier.initialize(config);
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
