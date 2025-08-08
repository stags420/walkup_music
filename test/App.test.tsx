import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AppContent, AuthenticatedApp } from '@/App';
import type { AuthContextType } from '@/modules/auth';
import { PlayerServiceProvider } from '@/modules/game/providers/PlayerServiceProvider';
import { MusicServiceProvider } from '@/modules/music/providers/MusicServiceProvider';

// Mock the service providers
jest.mock('@/modules/game/providers/PlayerServiceProvider', () => ({
  PlayerServiceProvider: {
    getOrCreate: jest.fn(() => ({
      getAllPlayers: jest.fn().mockResolvedValue([]),
      createPlayer: jest.fn(),
      updatePlayer: jest.fn(),
      deletePlayer: jest.fn(),
      getPlayer: jest.fn(),
    })),
  },
}));

jest.mock('@/modules/auth/providers/AuthServiceProvider', () => ({
  AuthServiceProvider: {
    getOrCreate: jest.fn(() => ({
      login: jest.fn(),
      logout: jest.fn(),
      getAccessToken: jest.fn(),
      isAuthenticated: jest.fn(),
      refreshToken: jest.fn(),
      handleCallback: jest.fn(),
      getUserInfo: jest.fn(),
    })),
  },
}));

jest.mock('@/modules/music/providers/MusicServiceProvider', () => ({
  MusicServiceProvider: {
    getOrCreate: jest.fn(() => ({
      searchTracks: jest.fn(),
      playTrack: jest.fn(),
      previewTrack: jest.fn(),
      pause: jest.fn(),
      resume: jest.fn(),
      seek: jest.fn(),
      getCurrentTrack: jest.fn(),
      isPlaybackReady: jest.fn(),
      getCurrentState: jest.fn(),
      isPlaybackConnected: jest.fn(),
    })),
  },
}));

jest.mock('@/modules/storage', () => ({
  StorageServiceProvider: {
    getOrCreate: jest.fn(() => ({
      save: jest.fn(),
      load: jest.fn(),
      delete: jest.fn(),
      clear: jest.fn(),
      export: jest.fn(),
      import: jest.fn(),
    })),
  },
}));

jest.mock('@/modules/game/providers/LineupServiceProvider', () => ({
  LineupServiceProvider: {
    getOrCreate: jest.fn(() => ({
      createBattingOrder: jest.fn(),
      updateBattingOrder: jest.fn(),
      getCurrentBatter: jest.fn(),
      getOnDeckBatter: jest.fn(),
      getInTheHoleBatter: jest.fn(),
      nextBatter: jest.fn(),
      playWalkUpMusic: jest.fn(),
      stopMusic: jest.fn(),
      startGame: jest.fn(),
      endGame: jest.fn(),
      isGameInProgress: jest.fn().mockReturnValue(false),
      getCurrentBattingOrder: jest.fn(),
      loadGameState: jest.fn().mockResolvedValue(undefined),
    })),
  },
}));

// Mock the components
jest.mock('@/modules/auth/components/LoginPage', () => ({
  LoginPage: ({ auth }: { auth: AuthContextType }) => (
    <div data-testid="login-page">
      <h1>Login Page</h1>
      <p>
        Auth state:{' '}
        {auth.state.isAuthenticated ? 'authenticated' : 'unauthenticated'}
      </p>
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

jest.mock('@/modules/game/components/GameMode', () => ({
  GameMode: () => <div data-testid="game-mode">Game Mode</div>,
}));

// Mock the auth hook
jest.mock('@/modules/auth', () => ({
  ...jest.requireActual('@/modules/auth'),
  useAuth: jest.fn(),
}));

// Import the mocked useAuth
import { useAuth } from '@/modules/auth';

describe('App Component Rendering', () => {
  const mockAuth: AuthContextType = {
    state: {
      isAuthenticated: false,
      user: null,
    },
    login: jest.fn(),
    logout: jest.fn(),
    handleCallback: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useAuth as jest.Mock).mockReturnValue(mockAuth);
  });

  describe('AppContent', () => {
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

    test('should render callback page when navigating to callback route', () => {
      // Given I have any auth state
      // When I render AppContent with callback route
      render(
        <MemoryRouter initialEntries={['/callback']}>
          <AppContent auth={mockAuth} />
        </MemoryRouter>
      );

      // Then it should display the callback page
      expect(screen.getByTestId('callback-page')).toBeInTheDocument();
      expect(
        screen.getByText('Processing authentication...')
      ).toBeInTheDocument();
    });

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

    test('should integrate with service providers and render PlayerManager', async () => {
      // Given I have an authenticated user
      const authenticatedAuth = {
        ...mockAuth,
        state: {
          ...mockAuth.state,
          isAuthenticated: true,
          user: {
            id: 'jane-smith',
            email: 'jane@example.com',
            displayName: 'Jane Smith',
          },
        },
      };

      // When I render AuthenticatedApp
      render(<AuthenticatedApp auth={authenticatedAuth} />);

      // Then it should call service providers and render PlayerManager
      // These are already imported at the top of the file via jest.mock

      expect(PlayerServiceProvider.getOrCreate).toHaveBeenCalled();
      expect(MusicServiceProvider.getOrCreate).toHaveBeenCalled();

      await waitFor(() => {
        expect(screen.getByText('Lineup')).toBeInTheDocument();
      });
    });

    test('should handle missing user display name gracefully', async () => {
      // Given I have an authenticated user without display name
      const authenticatedAuth = {
        ...mockAuth,
        state: {
          ...mockAuth.state,
          isAuthenticated: true,
          user: null, // No user object
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
