import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './components/AuthProvider';
import { useAuth } from './hooks/AuthHook';
import { LoginPage, CallbackPage } from '@/components';
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
                  <div>Dashboard coming soon...</div>
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

function App() {
  return (
    <Router
      basename="/walk-up-music-manager"
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

export default App;
