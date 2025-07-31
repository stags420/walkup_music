import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import {
  LoginPage,
  AuthService,
  AuthContextType,
  AuthState,
} from '@/modules/auth';

// Mock auth service for testing
class MockAuthService implements AuthService {
  private shouldFailLogin = false;
  private loginCalled = false;

  setShouldFailLogin(value: boolean) {
    this.shouldFailLogin = value;
  }

  wasLoginCalled(): boolean {
    return this.loginCalled;
  }

  async login(): Promise<void> {
    this.loginCalled = true;
    if (this.shouldFailLogin) {
      throw new Error('Spotify Premium subscription is required');
    }
  }

  async logout(): Promise<void> {}
  async getAccessToken(): Promise<string | null> {
    return null;
  }
  isAuthenticated(): boolean {
    return false;
  }
  async refreshToken(): Promise<void> {}
  async handleCallback(): Promise<void> {}
}

function createMockAuthContext(
  authService?: MockAuthService,
  overrides?: Partial<AuthState>
): { auth: AuthContextType; service: MockAuthService } {
  const service = authService || new MockAuthService();

  const defaultState: AuthState = {
    isAuthenticated: false,
    isLoading: false,
    user: null,
    error: null,
    ...overrides,
  };

  const auth: AuthContextType = {
    state: defaultState,
    login: jest.fn().mockImplementation(service.login.bind(service)),
    logout: jest.fn().mockImplementation(service.logout.bind(service)),
    clearError: jest.fn(),
    handleCallback: jest
      .fn()
      .mockImplementation(service.handleCallback.bind(service)),
  };

  return { auth, service };
}

function renderLoginPage(
  authService?: MockAuthService,
  stateOverrides?: Partial<AuthState>
) {
  const { auth, service } = createMockAuthContext(authService, stateOverrides);
  return {
    service,
    auth,
    ...render(<LoginPage auth={auth} />),
  };
}

describe('LoginPage', () => {
  it('should render login page with Spotify button', () => {
    // Given I have a login page
    // When I render the login page
    renderLoginPage();

    // Then it should display the login page elements
    expect(
      screen.getByRole('heading', { name: /walk-up music manager/i })
    ).toBeInTheDocument();
    expect(
      screen.getByText(/connect your spotify premium account/i)
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /connect with spotify/i })
    ).toBeInTheDocument();
  });

  it('should display premium benefits information', () => {
    // Given I have a login page
    // When I render the login page
    renderLoginPage();

    // Then it should display premium benefits information
    expect(screen.getByText(/why spotify premium\?/i)).toBeInTheDocument();
    expect(
      screen.getByText(/full track playback during games/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/high-quality audio streaming/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/access to complete music library/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/precise playback control/i)).toBeInTheDocument();
  });

  it('should display upgrade link for non-premium users', () => {
    // Given I have a login page
    // When I render the login page
    renderLoginPage();

    // Then it should display an upgrade link with correct attributes
    const upgradeLink = screen.getByRole('link', {
      name: /upgrade your account/i,
    });
    expect(upgradeLink).toBeInTheDocument();
    expect(upgradeLink).toHaveAttribute(
      'href',
      'https://www.spotify.com/premium/'
    );
    expect(upgradeLink).toHaveAttribute('target', '_blank');
    expect(upgradeLink).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('should call login when Spotify button is clicked', async () => {
    // Given I have a login page with a mock auth service
    const { service } = renderLoginPage();

    // When I click the login button
    const loginButton = screen.getByRole('button', {
      name: /connect with spotify/i,
    });
    fireEvent.click(loginButton);

    // Then the login method should be called
    await waitFor(() => {
      expect(service.wasLoginCalled()).toBe(true);
    });
  });

  it('should show loading state during login', async () => {
    // Given I have a login page in loading state
    renderLoginPage(undefined, { isLoading: true });

    // Then it should show a loading state
    expect(screen.getByText(/connecting\.\.\./i)).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeDisabled();

    // Check for loading spinner
    expect(document.querySelector('.loading-spinner')).toBeInTheDocument();
  });

  it('should display error message when login fails', async () => {
    // Given I have a login page with an error state
    renderLoginPage(undefined, {
      error: 'Spotify Premium subscription is required',
    });

    // Then an error message should be displayed
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(
      screen.getByText(/spotify premium subscription is required/i)
    ).toBeInTheDocument();
  });

  it('should clear error when dismiss button is clicked', async () => {
    // Given I have a login page with an error state
    const { auth } = renderLoginPage(undefined, {
      error: 'Test error message',
    });

    // When I click the dismiss button
    const dismissButton = screen.getByRole('button', {
      name: /dismiss error/i,
    });
    fireEvent.click(dismissButton);

    // Then the clearError function should be called
    expect(auth.clearError).toHaveBeenCalled();
  });

  it('should clear error before attempting new login', async () => {
    // Given I have a login page with an error state
    const { auth } = renderLoginPage(undefined, {
      error: 'Test error message',
    });

    // When I click the login button
    const loginButton = screen.getByRole('button', {
      name: /connect with spotify/i,
    });
    fireEvent.click(loginButton);

    // Then clearError should be called before login
    expect(auth.clearError).toHaveBeenCalled();
    expect(auth.login).toHaveBeenCalled();
  });

  it('should have proper accessibility attributes', () => {
    // Given I have a login page
    // When I render the login page
    renderLoginPage();

    // Then it should have proper accessibility attributes
    const loginButton = screen.getByRole('button', {
      name: /connect with spotify/i,
    });
    expect(loginButton).toHaveAttribute('aria-describedby', 'login-help');

    const helpText = screen.getByText(/you'll be redirected to spotify/i);
    expect(helpText).toHaveAttribute('id', 'login-help');
  });

  it('should display proper help text', () => {
    // Given I have a login page
    // When I render the login page
    renderLoginPage();

    // Then it should display helpful text about the login process
    expect(
      screen.getByText(
        /you'll be redirected to spotify to authorize this application/i
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText(/we only request permissions needed for music playback/i)
    ).toBeInTheDocument();
  });
});
