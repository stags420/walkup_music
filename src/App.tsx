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
  PlayerManager,
  PlayerServiceProvider,
  GameMode,
  LineupServiceProvider,
} from '@/modules/game';
import { MusicServiceProvider } from '@/modules/music';
import { StorageServiceProvider } from '@/modules/storage';
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
  const musicService = MusicServiceProvider.getOrCreate(authService, false); // Use real Spotify integration
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
      <div className="App">
        <header className="App-header">
          <div className="header-content">
            <h1>Walk Up Music</h1>
            <p className="welcome-text">Loading...</p>
          </div>
        </header>
      </div>
    );
  }

  return (
    <div>
      <header className="App-header">
        <div className="header-content">
          <h1>Walk Up Music</h1>
          <p className="welcome-text">
            Welcome, {auth.state.user?.displayName}!
          </p>
        </div>
      </header>
      <main>
        {isGameMode ? (
          <GameMode
            lineupService={lineupService}
            playerService={playerService}
            musicService={musicService}
            onEndGame={handleEndGame}
          />
        ) : (
          <PlayerManager
            playerService={playerService}
            musicService={musicService}
            lineupService={lineupService}
            onStartGame={handleStartGame}
          />
        )}
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
  return (
    <Router basename="/">
      <AuthProvider authService={authService}>
        <AppContainer />
      </AuthProvider>
    </Router>
  );
}

// Export internal components for testing
export { AppContent, AuthenticatedApp };

export default App;
