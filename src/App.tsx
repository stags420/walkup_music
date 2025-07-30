import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth, LoginPage, CallbackPage } from '@/modules/auth';
import { PlayerManager, PlayerServiceFactory } from '@/modules/game';
import './App.css';

function AppContent() {
  const { state: auth } = useAuth();

  if (auth.isLoading) {
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
        <Route path="/callback" element={<CallbackPage />} />
        <Route
          path="/"
          element={
            auth.isAuthenticated ? (
              <div>
                <header className="App-header">
                  <h1>Walk-Up Music Manager</h1>
                  <p>Welcome, {auth.user?.displayName}!</p>
                </header>
                <main>
                  <PlayerManager
                    playerService={PlayerServiceFactory.getInstance()}
                  />
                </main>
              </div>
            ) : (
              <LoginPage />
            )
          }
        />
      </Routes>
    </div>
  );
}

export function App() {
  return (
    <Router basename="/">
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

export default App;
