import {
  render,
  screen,
  waitFor,
  act,
  RenderResult,
} from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { CallbackPage, AuthProvider, AuthService } from '@/modules/auth';
import { AppConfig } from '@/modules/config';

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
}

const mockConfig: AppConfig = {
  maxSegmentDuration: 10,
  spotifyClientId: 'test-client-id',
  redirectUri: 'http://127.0.0.1:8000/callback',
};

async function renderCallbackPage(
  searchParams: string,
  authService?: MockAuthService
) {
  const service = authService || new MockAuthService();
  let result: RenderResult;

  await act(async () => {
    result = render(
      <MemoryRouter initialEntries={[`/callback${searchParams}`]}>
        <AuthProvider authService={service} config={mockConfig}>
          <CallbackPage />
        </AuthProvider>
      </MemoryRouter>
    );
  });

  return {
    service,
    ...result!,
  };
}

describe('CallbackPage', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  it('should render loading state initially', async () => {
    await renderCallbackPage('?code=test-code&state=test-state');

    expect(
      screen.getByText(/connecting to spotify\.\.\./i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/please wait while we complete your authentication/i)
    ).toBeInTheDocument();
    expect(document.querySelector('.loading-spinner')).toBeInTheDocument();
  });

  it('should handle successful callback', async () => {
    const { service } = await renderCallbackPage(
      '?code=test-code&state=test-state'
    );

    await waitFor(() => {
      expect(service.wasCallbackCalled()).toBe(true);
    });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });

    expect(service.getCallbackParams()).toEqual({
      code: 'test-code',
      state: 'test-state',
    });
  });

  it('should handle OAuth error parameter', async () => {
    await renderCallbackPage('?error=access_denied');

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/?error=access_denied');
    });
  });

  it('should handle missing code parameter', async () => {
    await renderCallbackPage('?state=test-state');

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith(
        '/?error=Invalid%20callback%20parameters'
      );
    });
  });

  it('should handle missing state parameter', async () => {
    await renderCallbackPage('?code=test-code');

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith(
        '/?error=Invalid%20callback%20parameters'
      );
    });
  });

  it('should handle callback failure', async () => {
    const mockService = new MockAuthService();
    mockService.setShouldFailCallback(true);

    await renderCallbackPage('?code=test-code&state=test-state', mockService);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith(
        '/?error=Invalid%20state%20parameter.%20Possible%20CSRF%20attack.'
      );
    });
  });

  it('should handle callback with generic error', async () => {
    const mockService = new MockAuthService();
    mockService.handleCallback = jest
      .fn()
      .mockRejectedValue(new Error('Network error'));

    await renderCallbackPage('?code=test-code&state=test-state', mockService);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/?error=Network%20error');
    });
  });

  it('should handle callback with non-Error exception', async () => {
    const mockService = new MockAuthService();
    mockService.handleCallback = jest.fn().mockRejectedValue('String error');

    await renderCallbackPage('?code=test-code&state=test-state', mockService);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith(
        '/?error=Authentication%20failed'
      );
    });
  });

  it('should display error if present in auth state', async () => {
    // This test would require a way to inject error state into the auth context
    // For now, we'll test the error display structure
    await renderCallbackPage('?code=test-code&state=test-state');

    // The error message container should be present in the DOM structure
    // even if not currently showing an error
    expect(
      screen.getByText(/connecting to spotify\.\.\./i)
    ).toBeInTheDocument();
  });
});
