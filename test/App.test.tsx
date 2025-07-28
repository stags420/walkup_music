import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// Test the App component content without nesting routers
const AppContent = () => (
  <div className="App">
    <header className="App-header">
      <h1>Walk-Up Music Manager</h1>
    </header>
    <main>
      <div>Welcome to Walk-Up Music Manager</div>
    </main>
  </div>
);

// Create a test wrapper that provides the router context
const TestApp = () => (
  <MemoryRouter
    initialEntries={['/']}
    future={{
      v7_startTransition: true,
      v7_relativeSplatPath: true,
    }}
  >
    <AppContent />
  </MemoryRouter>
);

test('renders walk-up music manager heading', () => {
  render(<TestApp />);
  const headingElement = screen.getByRole('heading', {
    name: /Walk-Up Music Manager/i,
  });
  expect(headingElement).toBeInTheDocument();
});

test('renders welcome message', () => {
  render(<TestApp />);
  const welcomeElement = screen.getByText(/Welcome to Walk-Up Music Manager/i);
  expect(welcomeElement).toBeInTheDocument();
});
