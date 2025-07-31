import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { appConfigProvider } from '@/modules/config';
import { AuthContextType } from '@/modules/auth';
import { AppContent, AuthenticatedApp } from '@/App';
import { PlayerServiceProvider } from '@/modules/game';
import { MusicServiceProvider } from '@/modules/music';

// Mock config for tests
const mockConfig = {
  maxSegmentDuration: 10,
  spotifyClientId: 'test-client-id',
  redirectUri: 'http://test.example.com/callback',
};

// Create singleton instances for mocking
const mockPlayerService = {
  getAllPlayers: jest.fn().mockResolvedValue([]),
  createPlayer: jest.fn(),
  updatePlayer: jest.fn(),
  deletePlayer: jest.fn(),
};

const mockMusicService = {
  searchTracks: jest.fn().mockResolvedValue([]),
};

// Mock the service providers to avoid side effects in tests
jest.mock('@/modules/game', () => ({
  ...jest.requireActual('@/modules/game'),
  PlayerServiceProvider: {
    getOrCreate: jest.fn(() => mockPlayerService),
  },
  PlayerManager: ({
    playerService: _playerService,
    musicService: _musicService,
  }: {
    playerService: unknown;
    musicService: unknown;
  }) => <div data-testid="player-manager">Player Manager with services</div>,
}));

jest.mock('@/modules/music', () => ({
  ...jest.requireActual('@/modules/music'),
  MusicServiceProvider: {
    getOrCreate: jest.fn(() => mockMusicService),
  },
}));

// Mock auth components to avoid complex dependencies
jest.mock('@/modules/auth', () => ({
  ...jest.requireActual('@/modules/auth'),
  LoginPage: ({ auth: _auth }: { auth: unknown }) => (
    <div data-testid="login-page">
      <h1>Connect your Spotify Premium account</h1>
      <button>Connect with Spotify</button>
    </div>
  ),
  CallbackPage: ({ auth: _auth }: { auth: unknown }) => (
    <div data-testid="callback-page">Processing authentication...</div>
  ),
}));

describe('App Component Rendering', () => {
  let mockAuth: AuthContextType;

  beforeEach(() => {
    // Initialize global config before each test
    appConfigProvider.reset();
    appConfigProvider.initialize(mockConfig);

    // Create base mock auth context
    mockAuth = {
      state: {
        isAuthenticated: false,
        isLoading: false,
        user: null,
        error: null,
      },
      login: jest.fn(),
      logout: jest.fn(),
    };
  });

  afterEach(() => {
    // Clean up after each test
    appConfigProvider.reset();
    jest.clearAllMocks();
  });

  describe('AppContent', () => {
    test('should render loading state when authentication is in progress', () => {
      // Given I have authentication in loading state
      const loadingAuth = {
        ...mockAuth,
        state: { ...mockAuth.state, isLoading: true },
      };

      // When I render AppContent with loading auth
      render(<AppContent auth={loadingAuth} />);

      // Then it should display the loading UI
      expect(screen.getByText('Loading...')).toBeInTheDocument();
      expect(screen.getByText('Loading...').previousElementSibling).toHaveClass(
        'loading-spinner'
      );
    });

    test('should render login page when user is not authenticated', () => {
      // Given I have an unauthenticated user
      const unauthenticatedAuth = {
        ...mockAuth,
        state: { ...mockAuth.state, isAuthenticated: false },
      };

      // When I render AppContent wrapped in router
      render(
        <MemoryRouter initialEntries={['/']}>
          <AppContent auth={unauthenticatedAuth} />
        </MemoryRouter>
      );

      // Then it should display the login page
      expect(screen.getByTestId('login-page')).toBeInTheDocument();
      expect(
        screen.getByText('Connect your Spotify Premium account')
      ).toBeInTheDocument();
    });

    test('should render authenticated app when user is logged in', () => {
      // Given I have an authenticated user
      const authenticatedAuth = {
        ...mockAuth,
        state: {
          ...mockAuth.state,
          isAuthenticated: true,
          user: { displayName: 'Test User' },
        },
      };

      // When I render AppContent wrapped in router
      render(
        <MemoryRouter initialEntries={['/']}>
          <AppContent auth={authenticatedAuth} />
        </MemoryRouter>
      );

      // Then it should display the authenticated app
      expect(screen.getByText('Walk-Up Music Manager')).toBeInTheDocument();
      expect(screen.getByText('Welcome, Test User!')).toBeInTheDocument();
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

    test('should handle authentication state transitions correctly', () => {
      // Given I start with unauthenticated state
      const { rerender } = render(
        <MemoryRouter initialEntries={['/']}>
          <AppContent auth={mockAuth} />
        </MemoryRouter>
      );

      // Then it should show login page
      expect(screen.getByTestId('login-page')).toBeInTheDocument();

      // When authentication becomes loading
      const loadingAuth = {
        ...mockAuth,
        state: { ...mockAuth.state, isLoading: true },
      };
      rerender(<AppContent auth={loadingAuth} />);

      // Then it should show loading state
      expect(screen.getByText('Loading...')).toBeInTheDocument();

      // When user becomes authenticated
      const authenticatedAuth = {
        ...mockAuth,
        state: {
          ...mockAuth.state,
          isAuthenticated: true,
          isLoading: false,
          user: { displayName: 'Test User' },
        },
      };
      rerender(
        <MemoryRouter initialEntries={['/']}>
          <AppContent auth={authenticatedAuth} />
        </MemoryRouter>
      );

      // Then it should show authenticated content
      expect(screen.getByText('Welcome, Test User!')).toBeInTheDocument();
    });
  });

  describe('AuthenticatedApp', () => {
    test('should render authenticated app with user information', () => {
      // Given I have an authenticated user
      const authenticatedAuth = {
        ...mockAuth,
        state: {
          ...mockAuth.state,
          isAuthenticated: true,
          user: { displayName: 'John Doe' },
        },
      };

      // When I render AuthenticatedApp
      render(<AuthenticatedApp auth={authenticatedAuth} />);

      // Then it should display the app header and user welcome
      expect(screen.getByText('Walk-Up Music Manager')).toBeInTheDocument();
      expect(screen.getByText('Welcome, John Doe!')).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
        'Walk-Up Music Manager'
      );
    });

    test('should integrate with service providers and render PlayerManager', async () => {
      // Given I have an authenticated user
      const authenticatedAuth = {
        ...mockAuth,
        state: {
          ...mockAuth.state,
          isAuthenticated: true,
          user: { displayName: 'Jane Smith' },
        },
      };

      // When I render AuthenticatedApp
      render(<AuthenticatedApp auth={authenticatedAuth} />);

      // Then it should call service providers and render PlayerManager
      // These are already imported at the top of the file via jest.mock

      expect(PlayerServiceProvider.getOrCreate).toHaveBeenCalled();
      expect(MusicServiceProvider.getOrCreate).toHaveBeenCalled();

      await waitFor(() => {
        expect(screen.getByTestId('player-manager')).toBeInTheDocument();
      });
    });

    test('should handle missing user display name gracefully', () => {
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
      expect(screen.getByText('Walk-Up Music Manager')).toBeInTheDocument();
      expect(screen.getByText('Welcome, !')).toBeInTheDocument(); // Empty display name
    });
  });
});
