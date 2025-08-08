import type { RenderResult } from '@testing-library/react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { AuthService, AuthContextType, AuthState } from '@/modules/auth';
import { CallbackPage } from '@/modules/auth';

// Mock navigate function
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// Mock auth service for testing
class MockAuthService implements AuthService {
  private shouldFailCallback = false;
  private callbackCalled = false;
  private callbackParams: { code: string; state: string } | null = null;

  setShouldFailCallback(value: boolean) {
    this.shouldFailCallback = value;
  }

  wasCallbackCalled(): boolean {
    return this.callbackCalled;
  }

  getCallbackParams() {
    return this.callbackParams;
  }

  async handleCallback(code: string, state: string): Promise<void> {
    this.callbackCalled = true;
    this.callbackParams = { code, state };

    if (this.shouldFailCallback) {
      throw new Error('Invalid state parameter. Possible CSRF attack.');
    }
  }

  async login(): Promise<void> {}
  async logout(): Promise<void> {}
  async getAccessToken(): Promise<string | null> {
    return null;
  }
  isAuthenticated(): boolean {
    return false;
  }
  async refreshToken(): Promise<void> {}
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
    login: service.login.bind(service),
    logout: service.logout.bind(service),
    handleCallback: service.handleCallback.bind(service),
  };

  return { auth, service };
}

async function renderCallbackPage(
  searchParams: string,
  authService?: MockAuthService,
  stateOverrides?: Partial<AuthState>
) {
  const { auth, service } = createMockAuthContext(authService, stateOverrides);
  let result: RenderResult;

  await act(async () => {
    result = render(
      <MemoryRouter initialEntries={[`/callback${searchParams}`]}>
        <CallbackPage auth={auth} />
      </MemoryRouter>
    );
  });

  return {
    service,
    auth,
    ...result!,
  };
}

describe('CallbackPage', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  it('should render loading state initially', async () => {
    // Given I have a callback page with valid parameters
    // When I render the callback page
    await renderCallbackPage('?code=test-code&state=test-state');

    // Then it should show a loading state
    expect(
      screen.getByText(/connecting to spotify\.\.\./i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/please wait while we complete your authentication/i)
    ).toBeInTheDocument();
    expect(document.querySelector('.loading-spinner')).toBeInTheDocument();
  });

  it('should handle successful callback', async () => {
    // Given I have a callback page with valid parameters
    const { service } = await renderCallbackPage(
      '?code=test-code&state=test-state'
    );

    // When the callback is processed
    await waitFor(() => {
      expect(service.wasCallbackCalled()).toBe(true);
    });

    // Then the user should be redirected to the home page
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });

    expect(service.getCallbackParams()).toEqual({
      code: 'test-code',
      state: 'test-state',
    });
  });

  it('should handle OAuth error parameter', async () => {
    // Given I have a callback page with an OAuth error parameter
    // When I render the callback page
    await renderCallbackPage('?error=access_denied');

    // Then the user should be redirected with the error
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/?error=access_denied');
    });
  });

  it('should handle missing code parameter', async () => {
    // Given I have a callback page with missing code parameter
    // When I render the callback page
    await renderCallbackPage('?state=test-state');

    // Then the user should be redirected with an error
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith(
        '/?error=Invalid%20callback%20parameters'
      );
    });
  });

  it('should handle missing state parameter', async () => {
    // Given I have a callback page with missing state parameter
    // When I render the callback page
    await renderCallbackPage('?code=test-code');

    // Then the user should be redirected with an error
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith(
        '/?error=Invalid%20callback%20parameters'
      );
    });
  });

  it('should handle callback failure', async () => {
    // Given I have an auth service that will fail the callback
    const mockService = new MockAuthService();
    mockService.setShouldFailCallback(true);

    // When I render the callback page
    await renderCallbackPage('?code=test-code&state=test-state', mockService);

    // Then the user should be redirected with the error
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith(
        '/?error=Invalid%20state%20parameter.%20Possible%20CSRF%20attack.'
      );
    });
  });

  it('should handle callback with generic error', async () => {
    // Given I have an auth service that will throw a generic error
    const mockService = new MockAuthService();
    mockService.handleCallback = jest
      .fn()
      .mockRejectedValue(new Error('Network error'));

    // When I render the callback page
    await renderCallbackPage('?code=test-code&state=test-state', mockService);

    // Then the user should be redirected with the error
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/?error=Network%20error');
    });
  });

  it('should handle callback with non-Error exception', async () => {
    // Given I have an auth service that will throw a non-Error exception
    const mockService = new MockAuthService();
    mockService.handleCallback = jest.fn().mockRejectedValue('String error');

    // When I render the callback page
    await renderCallbackPage('?code=test-code&state=test-state', mockService);

    // Then the user should be redirected with a generic error
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith(
        '/?error=Authentication%20failed'
      );
    });
  });
});
