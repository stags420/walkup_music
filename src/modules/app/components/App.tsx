import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import type { AuthContextType } from '@/modules/auth';
import { useAuth, LoginPage, CallbackPage } from '@/modules/auth';
import { BattingOrderManager, GameMode } from '@/modules/game';
import { AppConfigProvider } from '@/modules/app';
import { useState, useEffect } from 'react';
import { useSettingsTheme } from '@/modules/app/hooks/useSettingsTheme';
import { useGameActive } from '@/modules/game/hooks/useLineup';
import { useSettingsActions } from '@/modules/app/hooks/useSettingsActions';
import type { ThemeMode } from '@/modules/app/state/settingsStore';
import './App.css';

interface AppContentProps {
  auth: AuthContextType;
}

function AppContent(props: AppContentProps) {
  const auth = props.auth;
  return (
    <div className="App">
      <Routes>
        <Route path="/callback" element={<CallbackPage auth={auth} />} />
        <Route
          path="/"
          element={
            auth.state.isAuthenticated ? (
              <AuthenticatedApp auth={auth} />
            ) : (
              <LoginPage auth={auth} />
            )
          }
        />
      </Routes>
    </div>
  );
}

// Authenticated portion of the app with dependencies injected as props
function AuthenticatedApp(props: { auth: AuthContextType }) {
  const auth = props.auth;
  const isGameMode = useGameActive();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // With Zustand lineup store, assume not in game on initial load
    setIsLoading(false);
  }, [auth.state.isAuthenticated]);

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
        <p>Welcome, {auth.state.user?.displayName}!</p>
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

function AppContainer() {
  const auth = useAuth();
  return <AppContent auth={auth} />;
}

export function App() {
  const config = AppConfigProvider.get();
  const basename = config.basePath || '/';
  const theme = useSettingsTheme();
  const { setTheme } = useSettingsActions();
  const auth = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [themeOpen, setThemeOpen] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    const systemDark =
      globalThis.matchMedia &&
      globalThis.matchMedia('(prefers-color-scheme: dark)').matches;
    const effective: ThemeMode =
      theme === 'system' ? (systemDark ? 'dark' : 'light') : theme;
    root.dataset.bsTheme = effective === 'dark' ? 'dark' : 'light';
  }, [theme]);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('#user-menu')) {
        setMenuOpen(false);
        setThemeOpen(false);
      }
    };
    globalThis.addEventListener('click', onDocClick);
    return () => globalThis.removeEventListener('click', onDocClick);
  }, []);

  return (
    <Router basename={basename}>
      <nav
        className="navbar navbar-dark bg-dark px-3"
        style={{ borderBottom: '1px solid #2a2a2a' }}
      >
        <span className="navbar-brand mb-0 h1">Walk Up Music</span>
        <div id="user-menu" className="ms-auto position-relative">
          <button
            type="button"
            className="btn btn-sm btn-outline-success"
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen((v) => !v);
            }}
          >
            {auth.state.user
              ? `Welcome, ${auth.state.user.displayName}!`
              : 'Menu'}{' '}
            ▾
          </button>
          {menuOpen && (
            <div
              className="dropdown-menu dropdown-menu-end show"
              style={{ right: 0, left: 'auto', minWidth: 200 }}
            >
              <button
                className="dropdown-item d-flex justify-content-between align-items-center"
                onClick={(e) => {
                  e.stopPropagation();
                  setThemeOpen((v) => !v);
                }}
              >
                Theme
                <span className="text-muted small">{theme}</span>
              </button>
              {themeOpen && (
                <div className="px-2 pb-2">
                  <button
                    className={`dropdown-item ${theme === 'dark' ? 'active' : ''}`}
                    onClick={() => {
                      setTheme('dark');
                      setThemeOpen(false);
                      setMenuOpen(false);
                    }}
                  >
                    Dark
                  </button>
                  <button
                    className={`dropdown-item ${theme === 'light' ? 'active' : ''}`}
                    onClick={() => {
                      setTheme('light');
                      setThemeOpen(false);
                      setMenuOpen(false);
                    }}
                  >
                    Light
                  </button>
                  <button
                    className={`dropdown-item ${theme === 'system' ? 'active' : ''}`}
                    onClick={() => {
                      setTheme('system');
                      setThemeOpen(false);
                      setMenuOpen(false);
                    }}
                  >
                    System
                  </button>
                </div>
              )}
              {auth.state.isAuthenticated && (
                <>
                  <div className="dropdown-divider"></div>
                  <button
                    className="dropdown-item text-danger"
                    onClick={() => {
                      setMenuOpen(false);
                      setThemeOpen(false);
                      void auth.logout();
                    }}
                  >
                    Log out
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </nav>
      <AppContainer />
    </Router>
  );
}

export { AppContent, AuthenticatedApp };

export default App;
