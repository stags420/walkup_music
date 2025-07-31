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
  async getUserInfo(): Promise<{
    id: string;
    email: string;
    displayName: string;
  } | null> {
    return null;
  }
}

function createMockAuthContext(
  authService?: MockAuthService,
  overrides?: Partial<AuthState>
): { auth: AuthContextType; service: MockAuthService } {
  const service = authService || new MockAuthService();

  const defaultState: AuthState = {
    isAuthenticated: false,
    user: null,
    ...overrides,
  };

  const auth: AuthContextType = {
    state: defaultState,
    login: jest.fn().mockImplementation(service.login.bind(service)),
    logout: jest.fn().mockImplementation(service.logout.bind(service)),
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
