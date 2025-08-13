import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import { LoginPage, CallbackPage } from '@/modules/auth';
import { BattingOrderManager, GameMode } from '@/modules/game';
import { AppConfigProvider } from '@/modules/app';
import { useState, useEffect } from 'react';
import { useSettingsTheme } from '@/modules/app/hooks/useSettingsTheme';
import { useGameActive } from '@/modules/game/hooks/useLineup';
import { NavBar } from '@/modules/app/components/NavBar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ThemeMode } from '@/modules/app/state/settingsStore';
import './App.css';
import { useAuthUser } from '@/modules/auth/hooks/useAuthUser';

function AppContent() {
  const authUser = useAuthUser();
  return (
    <div className="App">
      <Routes>
        <Route path="/callback" element={<CallbackPage />} />
        <Route
          path="/"
          element={authUser ? <AuthenticatedApp /> : <LoginPage />}
        />
      </Routes>
    </div>
  );
}

function AuthenticatedApp() {
  const authUser = useAuthUser();
  const isGameMode = useGameActive();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // With Zustand lineup store, assume not in game on initial load
    setIsLoading(false);
  }, [authUser]);

  if (isLoading) {
    return (
      <div className="container-fluid">
        <div className="visually-hidden">
          <h1>Walk Up Music</h1>
        </div>
        <main>
          <div className="container">
            <div className="row">
              <div className="col-12 text-center py-5">
                <div className="loading-spinner mx-auto mb-3"></div>
                <p>Loading...</p>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="container-fluid">
      <div className="visually-hidden">
        <h1>Walk Up Music</h1>
        <p>Welcome, {authUser?.displayName ?? ''}!</p>
      </div>
      <main>
        <div className="container">
          <div className="row">
            <div className="col-12">
              {isGameMode ? <GameMode /> : <BattingOrderManager />}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export function App() {
  const config = AppConfigProvider.get();
  const basename = config.basePath || '/';
  const theme = useSettingsTheme();

  useEffect(() => {
    const root = document.documentElement;
    const systemDark =
      globalThis.matchMedia &&
      globalThis.matchMedia('(prefers-color-scheme: dark)').matches;
    const effective: ThemeMode =
      theme === 'system' ? (systemDark ? 'dark' : 'light') : theme;
    root.dataset.bsTheme = effective === 'dark' ? 'dark' : 'light';
  }, [theme]);

  const queryClient = new QueryClient();
  return (
    <QueryClientProvider client={queryClient}>
      <Router basename={basename}>
        <NavBar />
        <AppContent />
      </Router>
    </QueryClientProvider>
  );
}

export { AppContent, AuthenticatedApp };

export default App;
