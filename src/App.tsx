import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import {
  AuthProvider,
  useAuth,
  LoginPage,
  CallbackPage,
  AuthContextType,
  AuthServiceProvider,
} from '@/modules/auth';
import {
  BattingOrderManager,
  PlayerServiceProvider,
  GameMode,
  LineupServiceProvider,
} from '@/modules/game';
import { MusicServiceProvider } from '@/modules/music';
import { StorageServiceProvider } from '@/modules/storage';

import { AppConfigProvider } from '@/modules/config';
import { useState, useEffect } from 'react';
import './App.css';

interface AppContentProps {
  auth: AuthContextType;
}

function AppContent({ auth }: AppContentProps) {
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
function AuthenticatedApp({ auth }: { auth: AuthContextType }) {
  const [isGameMode, setIsGameMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Get services from singleton providers and pass as props
  // This follows the guidance: use singleton providers for stateless services
  const playerService = PlayerServiceProvider.getOrCreate();
  const authService = AuthServiceProvider.getOrCreate();
  const storageService = StorageServiceProvider.getOrCreate();
  const musicService = MusicServiceProvider.getOrCreate(authService); // Will use mock if config.mockAuth is true
  const lineupService = LineupServiceProvider.getOrCreate(
    playerService,
    musicService,
    storageService
  );

  // Check for existing game state on component mount
  useEffect(() => {
    const checkGameState = async () => {
      try {
        await lineupService.loadGameState();
        if (lineupService.isGameInProgress()) {
          setIsGameMode(true);
        }
      } catch (error) {
        console.error('Failed to load game state:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkGameState();
  }, [lineupService]);

  const handleStartGame = () => {
    setIsGameMode(true);
  };

  const handleEndGame = () => {
    setIsGameMode(false);
  };

  if (isLoading) {
    return (
      <div className="container-fluid">
        <header className="App-header">
          <div className="container">
            <div className="row">
              <div className="col-12">
                <div className="d-flex justify-content-between align-items-center">
                  <h1 className="mb-0">Walk Up Music</h1>
                  <p className="welcome-text mb-0">Loading...</p>
                </div>
              </div>
            </div>
          </div>
        </header>
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
      <header className="App-header">
        <div className="container">
          <div className="row">
            <div className="col-12">
              <div className="d-flex justify-content-between align-items-center">
                <h1 className="mb-0">Walk Up Music</h1>
                <p className="welcome-text mb-0">
                  Welcome, {auth.state.user?.displayName}!
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>
      <main>
        <div className="container">
          <div className="row">
            <div className="col-12">
              {isGameMode ? (
                <GameMode
                  lineupService={lineupService}
                  playerService={playerService}
                  musicService={musicService}
                  onEndGame={handleEndGame}
                />
              ) : (
                <BattingOrderManager
                  playerService={playerService}
                  musicService={musicService}
                  lineupService={lineupService}
                  onStartGame={handleStartGame}
                />
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// Container component that extracts auth context once and passes it down
function AppContainer() {
  const auth = useAuth();
  return <AppContent auth={auth} />;
}

export function App() {
  const authService = AuthServiceProvider.getOrCreate();
  const config = AppConfigProvider.get();
  const basename = config.basePath || '/';

  return (
    <Router basename={basename}>
      <AuthProvider authService={authService}>
        <AppContainer />
      </AuthProvider>
    </Router>
  );
}

// Export internal components for testing
export { AppContent, AuthenticatedApp };

export default App;
