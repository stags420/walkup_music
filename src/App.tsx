import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';

function App() {
  return (
    <Router
      basename="/walk-up-music-manager"
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <div className="App">
        <header className="App-header">
          <h1>Walk-Up Music Manager</h1>
        </header>
        <main>
          <Routes>
            <Route
              path="/"
              element={<div>Welcome to Walk-Up Music Manager</div>}
            />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
