import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AuthProvider } from '@/components/AuthProvider';
import { useAuth } from '@/contexts/AuthContext';
import { AuthService } from '@/services/interfaces';
import { AppConfig } from '@/types/AppConfig';

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
}

// Test component that uses the auth context
function TestComponent() {
  const { state, login, logout, clearError, handleCallback } = useAuth();

  return (
    <div>
      <div data-testid="auth-status">
        {state.isAuthenticated ? 'authenticated' : 'not-authenticated'}
      </div>
      <div data-testid="loading-status">
        {state.isLoading ? 'loading' : 'not-loading'}
      </div>
      <div data-testid="error-status">{state.error || 'no-error'}</div>
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
      <button onClick={clearError} data-testid="clear-error-button">
        Clear Error
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
};

describe('AuthContext', () => {
  let mockAuthService: MockAuthService;

  beforeEach(() => {
    mockAuthService = new MockAuthService();
  });

  it('should provide initial unauthenticated state', () => {
    render(
      <AuthProvider authService={mockAuthService} config={mockConfig}>
        <TestComponent />
      </AuthProvider>
    );

    expect(screen.getByTestId('auth-status')).toHaveTextContent(
      'not-authenticated'
    );
    expect(screen.getByTestId('loading-status')).toHaveTextContent(
      'not-loading'
    );
    expect(screen.getByTestId('error-status')).toHaveTextContent('no-error');
    expect(screen.getByTestId('user-info')).toHaveTextContent('no-user');
  });

  it('should detect existing authentication on mount', async () => {
    mockAuthService.setAuthenticated(true);

    render(
      <AuthProvider authService={mockAuthService} config={mockConfig}>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent(
        'authenticated'
      );
    });

    expect(screen.getByTestId('user-info')).toHaveTextContent(
      'Spotify User (user@spotify.com)'
    );
  });

  it('should handle login success', async () => {
    render(
      <AuthProvider authService={mockAuthService} config={mockConfig}>
        <TestComponent />
      </AuthProvider>
    );

    fireEvent.click(screen.getByTestId('login-button'));

    await waitFor(() => {
      expect(screen.getByTestId('loading-status')).toHaveTextContent('loading');
    });
  });

  it('should handle login failure', async () => {
    mockAuthService.setShouldFailLogin(true);

    render(
      <AuthProvider authService={mockAuthService} config={mockConfig}>
        <TestComponent />
      </AuthProvider>
    );

    fireEvent.click(screen.getByTestId('login-button'));

    await waitFor(() => {
      expect(screen.getByTestId('error-status')).toHaveTextContent(
        'Login failed'
      );
    });

    expect(screen.getByTestId('auth-status')).toHaveTextContent(
      'not-authenticated'
    );
    expect(screen.getByTestId('loading-status')).toHaveTextContent(
      'not-loading'
    );
  });

  it('should handle logout', async () => {
    mockAuthService.setAuthenticated(true);

    render(
      <AuthProvider authService={mockAuthService} config={mockConfig}>
        <TestComponent />
      </AuthProvider>
    );

    // Wait for initial auth check
    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent(
        'authenticated'
      );
    });

    fireEvent.click(screen.getByTestId('logout-button'));

    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent(
        'not-authenticated'
      );
    });

    expect(screen.getByTestId('user-info')).toHaveTextContent('no-user');
  });

  it('should handle callback success', async () => {
    render(
      <AuthProvider authService={mockAuthService} config={mockConfig}>
        <TestComponent />
      </AuthProvider>
    );

    fireEvent.click(screen.getByTestId('handle-callback-button'));

    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent(
        'authenticated'
      );
    });

    expect(screen.getByTestId('user-info')).toHaveTextContent(
      'Spotify User (user@spotify.com)'
    );
  });

  it('should handle callback failure', async () => {
    mockAuthService.setShouldFailCallback(true);

    render(
      <AuthProvider authService={mockAuthService} config={mockConfig}>
        <TestComponent />
      </AuthProvider>
    );

    fireEvent.click(screen.getByTestId('handle-callback-button'));

    await waitFor(() => {
      expect(screen.getByTestId('error-status')).toHaveTextContent(
        'Callback failed'
      );
    });

    expect(screen.getByTestId('auth-status')).toHaveTextContent(
      'not-authenticated'
    );
  });

  it('should clear errors', async () => {
    mockAuthService.setShouldFailLogin(true);

    render(
      <AuthProvider authService={mockAuthService} config={mockConfig}>
        <TestComponent />
      </AuthProvider>
    );

    // Trigger an error
    fireEvent.click(screen.getByTestId('login-button'));

    await waitFor(() => {
      expect(screen.getByTestId('error-status')).toHaveTextContent(
        'Login failed'
      );
    });

    // Clear the error
    fireEvent.click(screen.getByTestId('clear-error-button'));

    expect(screen.getByTestId('error-status')).toHaveTextContent('no-error');
  });

  it('should throw error when used outside provider', () => {
    // Suppress console.error for this test
    const consoleSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    expect(() => {
      render(<TestComponent />);
    }).toThrow('useAuth must be used within an AuthProvider');

    consoleSpy.mockRestore();
  });
});
