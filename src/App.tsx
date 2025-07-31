import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import {
  AuthProvider,
  useAuth,
  LoginPage,
  CallbackPage,
  AuthContextType,
  authServiceProvider,
} from '@/modules/auth';
import { PlayerManager, PlayerServiceProvider } from '@/modules/game';
import { MusicServiceProvider } from '@/modules/music';
import './App.css';

interface AppContentProps {
  auth: AuthContextType;
}

function AppContent({ auth }: AppContentProps) {
  if (auth.state.isLoading) {
    return (
      <div className="app-loading">
        <div className="loading-spinner" aria-hidden="true"></div>
        <p>Loading...</p>
      </div>
    );
  }

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
  // Get services from singleton providers and pass as props
  // This follows the guidance: use singleton providers for stateless services
  const playerService = PlayerServiceProvider.getOrCreate();
  const authService = authServiceProvider.getOrCreate();
  const musicService = MusicServiceProvider.getOrCreate(authService, false); // Use real Spotify integration

  return (
    <div>
      <header className="App-header">
        <h1>Walk-Up Music Manager</h1>
        <p>Welcome, {auth.state.user?.displayName}!</p>
      </header>
      <main>
        <PlayerManager
          playerService={playerService}
          musicService={musicService}
        />
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
  return (
    <Router basename="/">
      <AuthProvider>
        <AppContainer />
      </AuthProvider>
    </Router>
  );
}

// Export internal components for testing
export { AppContent, AuthenticatedApp };

export default App;
