import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LoginPage, AuthProvider, AuthService } from '@/modules/auth';
import { AppConfig } from '@/modules/config';

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

const mockConfig: AppConfig = {
  maxSegmentDuration: 10,
  spotifyClientId: 'test-client-id',
  redirectUri: 'http://127.0.0.1:8000/callback',
};

function renderLoginPage(authService?: MockAuthService) {
  const service = authService || new MockAuthService();
  return {
    service,
    ...render(
      <AuthProvider authService={service} config={mockConfig}>
        <LoginPage />
      </AuthProvider>
    ),
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
    // Given I have a login page with a service that never resolves
    const mockService = new MockAuthService();
    // Make login hang to test loading state
    mockService.login = jest
      .fn()
      .mockImplementation(() => new Promise(() => {}));

    renderLoginPage(mockService);

    // When I click the login button
    const loginButton = screen.getByRole('button', {
      name: /connect with spotify/i,
    });
    fireEvent.click(loginButton);

    // Then it should show a loading state
    await waitFor(() => {
      expect(screen.getByText(/connecting\.\.\./i)).toBeInTheDocument();
      expect(screen.getByRole('button')).toBeDisabled();
    });

    // Check for loading spinner
    expect(document.querySelector('.loading-spinner')).toBeInTheDocument();
  });

  it('should display error message when login fails', async () => {
    // Given I have a login page with a service that will fail
    const mockService = new MockAuthService();
    mockService.setShouldFailLogin(true);

    renderLoginPage(mockService);

    // When I click the login button
    const loginButton = screen.getByRole('button', {
      name: /connect with spotify/i,
    });
    fireEvent.click(loginButton);

    // Then an error message should be displayed
    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(
        screen.getByText(/spotify premium subscription is required/i)
      ).toBeInTheDocument();
    });
  });

  it('should clear error when dismiss button is clicked', async () => {
    // Given I have a login page with a service that will fail
    const mockService = new MockAuthService();
    mockService.setShouldFailLogin(true);

    renderLoginPage(mockService);

    // When I trigger an error and then dismiss it
    const loginButton = screen.getByRole('button', {
      name: /connect with spotify/i,
    });
    fireEvent.click(loginButton);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    // Then dismissing the error should remove it
    const dismissButton = screen.getByRole('button', {
      name: /dismiss error/i,
    });
    fireEvent.click(dismissButton);

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('should clear error before attempting new login', async () => {
    // Given I have a login page with a service that will fail initially
    const mockService = new MockAuthService();
    mockService.setShouldFailLogin(true);

    renderLoginPage(mockService);

    // When I attempt a login that fails, then attempt another login
    const loginButton = screen.getByRole('button', {
      name: /connect with spotify/i,
    });
    fireEvent.click(loginButton);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    // Then the error should be cleared when starting a new login attempt
    mockService.setShouldFailLogin(false);
    fireEvent.click(loginButton);

    // Error should be cleared immediately when new login starts
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
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
