import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AppContent, AuthenticatedApp } from '@/modules/app/components/App';
import type { AuthContextType } from '@/modules/auth/models/AuthContextType';

// Mock the service providers
// Remove provider-specific mocks; components now get services via container hooks

// Mock the components
jest.mock('@/modules/auth/components/LoginPage', () => ({
  LoginPage: () => (
    <div data-testid="login-page">
      <h1>Login Page</h1>
    </div>
  ),
}));

jest.mock('@/modules/auth/components/CallbackPage', () => ({
  CallbackPage: () => (
    <div data-testid="callback-page">
      <h1>Callback Page</h1>
      <p>Processing authentication...</p>
    </div>
  ),
}));

jest.mock('@/modules/game/components/PlayerManager', () => ({
  PlayerManager: () => <div data-testid="player-manager">Player Manager</div>,
}));

jest.mock('@/modules/game/components/BattingOrderManager', () => ({
  BattingOrderManager: () => (
    <div data-testid="batting-order-manager">Batting Order Manager</div>
  ),
}));

jest.mock('@/modules/game/components/GameMode', () => ({
  GameMode: () => <div data-testid="game-mode">Game Mode</div>,
}));

// Mock the auth hook to control auth state
jest.mock('@/modules/auth', () => {
  const actual = jest.requireActual('@/modules/auth');
  return { ...actual, useAuth: jest.fn() };
});
import { useAuth } from '@/modules/auth';

describe('App Component Rendering', () => {
  const mockAuth: AuthContextType = {
    state: {
      isAuthenticated: false,
      user: undefined,
    },
    login: jest.fn(),
    logout: jest.fn(),
    handleCallback: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useAuth as jest.Mock).mockReturnValue(mockAuth);
  });

  describe('AppContent (simplified)', () => {
    test('should render login page when user is not authenticated', () => {
      // Given I have an unauthenticated user
      // When I render AppContent
      render(
        <MemoryRouter initialEntries={['/']}>
          <AppContent auth={mockAuth} />
        </MemoryRouter>
      );

      // Then it should display the login page
      expect(screen.getByTestId('login-page')).toBeInTheDocument();
    });

    test('should render authenticated app when user is logged in', async () => {
      // Given I have an authenticated user
      const authenticatedAuth = {
        ...mockAuth,
        state: {
          ...mockAuth.state,
          isAuthenticated: true,
          user: {
            id: 'test-user',
            email: 'test@example.com',
            displayName: 'Test User',
          },
        },
      };

      // When I render AppContent
      render(
        <MemoryRouter initialEntries={['/']}>
          <AppContent auth={authenticatedAuth} />
        </MemoryRouter>
      );

      // Then it should display the authenticated app
      expect(screen.getByText('Walk Up Music')).toBeInTheDocument();

      // Wait for loading to complete and then check for welcome message
      await waitFor(() => {
        expect(screen.getByText('Welcome, Test User!')).toBeInTheDocument();
      });
    });

    // Callback page behavior is covered elsewhere; omitted here

    test('should handle authentication state transitions correctly', async () => {
      // Given I start with unauthenticated state
      const { rerender } = render(
        <MemoryRouter initialEntries={['/']}>
          <AppContent auth={mockAuth} />
        </MemoryRouter>
      );

      // Then it should show login page
      expect(screen.getByTestId('login-page')).toBeInTheDocument();

      // When user becomes authenticated
      const authenticatedAuth = {
        ...mockAuth,
        state: {
          ...mockAuth.state,
          isAuthenticated: true,
          user: {
            id: 'test-user',
            email: 'test@example.com',
            displayName: 'Test User',
          },
        },
      };
      rerender(
        <MemoryRouter initialEntries={['/']}>
          <AppContent auth={authenticatedAuth} />
        </MemoryRouter>
      );

      // Then it should show authenticated content
      await waitFor(() => {
        expect(screen.getByText('Welcome, Test User!')).toBeInTheDocument();
      });
    });
  });

  describe('AuthenticatedApp', () => {
    test('should render authenticated app with user information', async () => {
      // Given I have an authenticated user
      const authenticatedAuth = {
        ...mockAuth,
        state: {
          ...mockAuth.state,
          isAuthenticated: true,
          user: {
            id: 'john-doe',
            email: 'john@example.com',
            displayName: 'John Doe',
          },
        },
      };

      // When I render AuthenticatedApp
      render(<AuthenticatedApp auth={authenticatedAuth} />);

      // Then it should display the app header and user welcome
      expect(screen.getByText('Walk Up Music')).toBeInTheDocument();

      // Wait for loading to complete and then check for welcome message
      await waitFor(() => {
        expect(screen.getByText('Welcome, John Doe!')).toBeInTheDocument();
      });

      expect(screen.getAllByRole('heading', { level: 1 })[0]).toHaveTextContent(
        'Walk Up Music'
      );
    });

    // Container wiring is exercised in integration; skip provider-call assertions here

    test('should handle missing user display name gracefully', async () => {
      // Given I have an authenticated user without display name
      const authenticatedAuth = {
        ...mockAuth,
        state: {
          ...mockAuth.state,
          isAuthenticated: true,
          user: undefined, // No user object
        },
      };

      // When I render AuthenticatedApp
      render(<AuthenticatedApp auth={authenticatedAuth} />);

      // Then it should still render without crashing
      expect(screen.getByText('Walk Up Music')).toBeInTheDocument();

      // Wait for loading to complete and then check for welcome message
      await waitFor(() => {
        expect(screen.getByText('Welcome, !')).toBeInTheDocument(); // Empty display name
      });
    });
  });
});
