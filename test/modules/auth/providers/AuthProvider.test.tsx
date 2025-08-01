import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth, AuthService } from '@/modules/auth';
import { appConfigProvider, AppConfig } from '@/modules/config';

// Mock auth service for testing
class MockAuthService implements AuthService {
  private authenticated = false;
  private shouldFailLogin = false;
  private shouldFailCallback = false;

  setAuthenticated(value: boolean) {
    this.authenticated = value;
  }

  setShouldFailLogin(value: boolean) {
    this.shouldFailLogin = value;
  }

  setShouldFailCallback(value: boolean) {
    this.shouldFailCallback = value;
  }

  async login(): Promise<void> {
    if (this.shouldFailLogin) {
      throw new Error('Login failed');
    }
    // In real implementation, this would redirect
  }

  async logout(): Promise<void> {
    this.authenticated = false;
  }

  async getAccessToken(): Promise<string | null> {
    return this.authenticated ? 'mock-token' : null;
  }

  isAuthenticated(): boolean {
    return this.authenticated;
  }

  async refreshToken(): Promise<void> {
    if (!this.authenticated) {
      throw new Error('Not authenticated');
    }
  }

  async handleCallback(_code: string, _state: string): Promise<void> {
    if (this.shouldFailCallback) {
      throw new Error('Callback failed');
    }
    this.authenticated = true;
  }

  async getUserInfo(): Promise<{
    id: string;
    email: string;
    displayName: string;
  } | null> {
    if (!this.authenticated) {
      return null;
    }
    return {
      id: 'test-user-id',
      email: 'user@spotify.com',
      displayName: 'Spotify User',
    };
  }
}

// Test component that uses the auth context
function TestComponent() {
  const { state, login, logout, handleCallback } = useAuth();

  return (
    <div>
      <div data-testid="auth-status">
        {state.isAuthenticated ? 'authenticated' : 'not-authenticated'}
      </div>
      <div data-testid="user-info">
        {state.user
          ? `${state.user.displayName} (${state.user.email})`
          : 'no-user'}
      </div>
      <button onClick={login} data-testid="login-button">
        Login
      </button>
      <button onClick={logout} data-testid="logout-button">
        Logout
      </button>
      <button
        onClick={async () => {
          try {
            await handleCallback('test-code', 'test-state');
          } catch {
            // Error is expected and handled by the context
          }
        }}
        data-testid="handle-callback-button"
      >
        Handle Callback
      </button>
    </div>
  );
}

const mockConfig: AppConfig = {
  maxSegmentDuration: 10,
  spotifyClientId: 'test-client-id',
  redirectUri: 'http://127.0.0.1:8000/callback',
  tokenRefreshBufferMinutes: 15,
  basePath: '',
  mockAuth: false,
};

describe('AuthContext', () => {
  let mockAuthService: MockAuthService;

  beforeEach(() => {
    mockAuthService = new MockAuthService();
    // Initialize global config for tests
    appConfigProvider.reset();
    appConfigProvider.initialize(mockConfig);
  });

  afterEach(() => {
    // Clean up global config after each test
    appConfigProvider.reset();
  });

  it('should provide initial unauthenticated state', () => {
    // Given I have an AuthProvider with a mock auth service
    // When I render the component
    render(
      <AuthProvider authService={mockAuthService}>
        <TestComponent />
      </AuthProvider>
    );

    // Then the initial state should be unauthenticated
    expect(screen.getByTestId('auth-status')).toHaveTextContent(
      'not-authenticated'
    );
    expect(screen.getByTestId('user-info')).toHaveTextContent('no-user');
  });

  it('should detect existing authentication on mount', async () => {
    // Given I have an auth service that is already authenticated
    mockAuthService.setAuthenticated(true);

    // When I render the AuthProvider
    render(
      <AuthProvider authService={mockAuthService}>
        <TestComponent />
      </AuthProvider>
    );

    // Then the component should detect the existing authentication
    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent(
        'authenticated'
      );
    });

    // And the user info should be loaded
    await waitFor(() => {
      expect(screen.getByTestId('user-info')).toHaveTextContent(
        'Spotify User (user@spotify.com)'
      );
    });
  });

  it('should handle logout', async () => {
    // Given I have an authenticated auth service
    mockAuthService.setAuthenticated(true);

    render(
      <AuthProvider authService={mockAuthService}>
        <TestComponent />
      </AuthProvider>
    );

    // Wait for initial auth check
    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent(
        'authenticated'
      );
    });

    // When I click the logout button
    fireEvent.click(screen.getByTestId('logout-button'));

    // Then the user should be logged out
    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent(
        'not-authenticated'
      );
    });

    expect(screen.getByTestId('user-info')).toHaveTextContent('no-user');
  });

  it('should handle callback success', async () => {
    // Given I have an AuthProvider with a mock auth service
    render(
      <AuthProvider authService={mockAuthService}>
        <TestComponent />
      </AuthProvider>
    );

    // When I handle a successful callback
    fireEvent.click(screen.getByTestId('handle-callback-button'));

    // Then the user should be authenticated
    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent(
        'authenticated'
      );
    });

    // And the user info should be loaded
    await waitFor(() => {
      expect(screen.getByTestId('user-info')).toHaveTextContent(
        'Spotify User (user@spotify.com)'
      );
    });
  });

  it('should throw error when used outside provider', () => {
    // Given I have a component that uses the auth context
    // When I render it without an AuthProvider
    // Then it should throw an error
    const consoleSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    expect(() => {
      render(<TestComponent />);
    }).toThrow('useAuth must be used within an AuthProvider');

    consoleSpy.mockRestore();
  });
});
