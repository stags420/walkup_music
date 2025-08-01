import { SpotifyAuthService } from '@/modules/auth';
import { AppConfig } from '@/modules/config';
import * as pkceUtils from '@/modules/auth/utils/pkce';
import * as cookieUtils from '@/modules/auth/utils/cookies';

// Mock dependencies
jest.mock('@/modules/auth/utils/pkce');
jest.mock('@/modules/auth/utils/cookies');

const mockPkce = pkceUtils as jest.Mocked<typeof pkceUtils>;
const mockCookies = cookieUtils as jest.Mocked<typeof cookieUtils>;

// Mock fetch
globalThis.fetch = jest.fn();
const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

// Mock globalThis.location
Object.defineProperty(globalThis, 'location', {
  value: {
    href: '',
  },
  writable: true,
});

describe('SpotifyAuthService', () => {
  let authService: SpotifyAuthService;
  let mockConfig: AppConfig;

  beforeEach(() => {
    jest.clearAllMocks();

    mockConfig = {
      spotifyClientId: 'test-client-id',
      redirectUri: 'http://127.0.0.1:8000/callback',
      maxSegmentDuration: 10,
      tokenRefreshBufferMinutes: 15,
      basePath: '',
    };

    // Mock cookie utilities
    mockCookies.areCookiesAvailable.mockReturnValue(true);
    mockCookies.getCookie.mockReturnValue(null);
    mockCookies.setCookie.mockImplementation(() => {});
    mockCookies.deleteCookie.mockImplementation(() => {});

    authService = new SpotifyAuthService(mockConfig);
  });

  describe('constructor', () => {
    it('should initialize with config', () => {
      // Given I have a valid config
      // When I create a SpotifyAuthService
      // Then it should be initialized correctly
      expect(authService).toBeInstanceOf(SpotifyAuthService);
    });

    it('should warn when cookies are not available', () => {
      // Given cookies are not available
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      mockCookies.areCookiesAvailable.mockReturnValue(false);

      // When I create a SpotifyAuthService
      new SpotifyAuthService(mockConfig);

      // Then a warning should be logged
      expect(consoleSpy).toHaveBeenCalledWith(
        'Cookies are not available. Authentication may not work properly.'
      );

      consoleSpy.mockRestore();
    });

    it('should load existing tokens from cookies', () => {
      // Given I have existing tokens in cookies
      mockCookies.getCookie
        .mockReturnValueOnce('access-token')
        .mockReturnValueOnce('refresh-token')
        .mockReturnValueOnce((Date.now() + 3600000).toString())
        .mockReturnValueOnce('streaming user-read-email');

      // When I create a SpotifyAuthService
      const service = new SpotifyAuthService(mockConfig);

      // Then it should be authenticated
      expect(service.isAuthenticated()).toBe(true);
    });
  });

  describe('login', () => {
    it('should initiate OAuth flow with correct parameters', async () => {
      // Given I have PKCE utilities that return test values
      mockPkce.generateCodeVerifier.mockReturnValue('test-verifier');
      mockPkce.generateCodeChallenge.mockResolvedValue('test-challenge');
      mockPkce.generateState.mockReturnValue('test-state');

      // When I call login
      await authService.login();

      // Then PKCE utilities should be called
      expect(mockPkce.generateCodeVerifier).toHaveBeenCalled();
      expect(mockPkce.generateCodeChallenge).toHaveBeenCalledWith(
        'test-verifier'
      );
      expect(mockPkce.generateState).toHaveBeenCalled();

      // And cookies should be set
      expect(mockCookies.setCookie).toHaveBeenCalledWith(
        'spotify_code_verifier',
        'test-verifier',
        expect.objectContaining({ maxAge: 600, sameSite: 'lax' })
      );

      expect(mockCookies.setCookie).toHaveBeenCalledWith(
        'spotify_state',
        'test-state',
        expect.objectContaining({ maxAge: 600, sameSite: 'lax' })
      );

      // And the user should be redirected to Spotify
      expect(globalThis.location.href).toContain(
        'https://accounts.spotify.com/authorize'
      );
      expect(globalThis.location.href).toContain('client_id=test-client-id');
      expect(globalThis.location.href).toContain(
        'code_challenge=test-challenge'
      );
      expect(globalThis.location.href).toContain('state=test-state');
    });
  });

  describe('handleCallback', () => {
    it('should handle successful callback', async () => {
      // Given I have stored state and code verifier in cookies
      mockCookies.getCookie
        .mockReturnValueOnce('test-state') // stored state
        .mockReturnValueOnce('test-verifier'); // code verifier

      const mockTokenResponse = {
        access_token: 'access-token',
        token_type: 'Bearer',
        expires_in: 3600,
        refresh_token: 'refresh-token',
        scope: 'streaming user-read-email',
      };

      const mockUserProfile = {
        id: 'user123',
        display_name: 'Test User',
        email: 'test@example.com',
        product: 'premium',
      };

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockTokenResponse),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockUserProfile),
        } as Response);

      // When I handle a successful callback
      await authService.handleCallback('auth-code', 'test-state');

      // Then cookies should be cleaned up and the user should be authenticated
      expect(mockCookies.deleteCookie).toHaveBeenCalledWith(
        'spotify_code_verifier',
        '/'
      );
      expect(mockCookies.deleteCookie).toHaveBeenCalledWith(
        'spotify_state',
        '/'
      );
      expect(authService.isAuthenticated()).toBe(true);
    });

    it('should throw error for invalid state', async () => {
      // Given I have a different state stored than what was received
      mockCookies.getCookie.mockReturnValueOnce('different-state');

      // When I handle a callback with mismatched state
      // Then it should throw a CSRF error
      await expect(
        authService.handleCallback('auth-code', 'test-state')
      ).rejects.toThrow('Invalid state parameter. Possible CSRF attack.');
    });

    it('should throw error when code verifier is missing', async () => {
      // Given I have state but no code verifier
      mockCookies.getCookie
        .mockReturnValueOnce('test-state')
        .mockReturnValueOnce(null); // no code verifier

      // When I handle a callback without code verifier
      // Then it should throw an error
      await expect(
        authService.handleCallback('auth-code', 'test-state')
      ).rejects.toThrow(
        'Code verifier not found. Please restart the login process.'
      );
    });

    it('should throw error for non-premium users', async () => {
      // Given I have valid state and code verifier, but user is not premium
      mockCookies.getCookie
        .mockReturnValueOnce('test-state')
        .mockReturnValueOnce('test-verifier');

      const mockTokenResponse = {
        access_token: 'access-token',
        token_type: 'Bearer',
        expires_in: 3600,
        scope: 'streaming user-read-email',
      };

      const mockUserProfile = {
        id: 'user123',
        display_name: 'Test User',
        email: 'test@example.com',
        product: 'free', // Not premium
      };

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockTokenResponse),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockUserProfile),
        } as Response);

      // When I handle a callback for a non-premium user
      // Then it should throw a premium requirement error
      await expect(
        authService.handleCallback('auth-code', 'test-state')
      ).rejects.toThrow(
        'Spotify Premium subscription is required to use this application'
      );
    });
  });

  describe('logout', () => {
    it('should clear all tokens and cookies', async () => {
      // Given I have an authenticated service
      // When I call logout
      await authService.logout();

      // Then all cookies should be deleted and the user should be unauthenticated
      expect(mockCookies.deleteCookie).toHaveBeenCalledTimes(6); // All cookie names
      expect(authService.isAuthenticated()).toBe(false);
    });
  });

  describe('getAccessToken', () => {
    it('should return null when not authenticated', async () => {
      // Given I have an unauthenticated service
      // When I get the access token
      const token = await authService.getAccessToken();

      // Then it should return null
      expect(token).toBeNull();
    });

    it('should return valid token when authenticated', async () => {
      // Given I have an authenticated service with valid tokens
      mockCookies.getCookie
        .mockReturnValueOnce('access-token')
        .mockReturnValueOnce('refresh-token')
        .mockReturnValueOnce((Date.now() + 3600000).toString())
        .mockReturnValueOnce('streaming user-read-email');

      const service = new SpotifyAuthService(mockConfig);

      // When I get the access token
      const token = await service.getAccessToken();

      // Then it should return the access token
      expect(token).toBe('access-token');
    });

    it('should refresh token when expired', async () => {
      // Given I have an expired token
      mockCookies.getCookie
        .mockReturnValueOnce('old-access-token')
        .mockReturnValueOnce('refresh-token')
        .mockReturnValueOnce((Date.now() - 1000).toString()) // Expired
        .mockReturnValueOnce('streaming user-read-email');

      const service = new SpotifyAuthService(mockConfig);

      const mockRefreshResponse = {
        access_token: 'new-access-token',
        token_type: 'Bearer',
        expires_in: 3600,
        scope: 'streaming user-read-email',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockRefreshResponse),
      } as Response);

      // When I get the access token
      const token = await service.getAccessToken();

      // Then it should refresh the token and return the new one
      expect(token).toBe('new-access-token');
      expect(mockFetch).toHaveBeenCalledWith(
        'https://accounts.spotify.com/api/token',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('grant_type=refresh_token'),
        })
      );
    });

    it('should logout on refresh failure', async () => {
      // Given I have an expired token and refresh will fail
      mockCookies.getCookie
        .mockReturnValueOnce('old-access-token')
        .mockReturnValueOnce('refresh-token')
        .mockReturnValueOnce((Date.now() - 1000).toString())
        .mockReturnValueOnce('streaming user-read-email');

      const service = new SpotifyAuthService(mockConfig);

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: () => Promise.resolve('Invalid refresh token'),
      } as Response);

      // When I get the access token
      const token = await service.getAccessToken();

      // Then it should return null and logout the user
      expect(token).toBeNull();
      expect(service.isAuthenticated()).toBe(false);
    });
  });

  describe('isAuthenticated', () => {
    it('should return false when no tokens', () => {
      // Given I have no tokens
      // When I check if authenticated
      // Then it should return false
      expect(authService.isAuthenticated()).toBe(false);
    });

    it('should return true when tokens are valid', () => {
      // Given I have valid tokens
      mockCookies.getCookie
        .mockReturnValueOnce('access-token')
        .mockReturnValueOnce('refresh-token')
        .mockReturnValueOnce((Date.now() + 3600000).toString())
        .mockReturnValueOnce('streaming user-read-email');

      const service = new SpotifyAuthService(mockConfig);

      // When I check if authenticated
      // Then it should return true
      expect(service.isAuthenticated()).toBe(true);
    });

    it('should return false when tokens are expired', () => {
      // Given I have expired tokens
      mockCookies.getCookie
        .mockReturnValueOnce('access-token')
        .mockReturnValueOnce('refresh-token')
        .mockReturnValueOnce((Date.now() - 1000).toString()) // Expired
        .mockReturnValueOnce('streaming user-read-email');

      const service = new SpotifyAuthService(mockConfig);

      // When I check if authenticated
      // Then it should return false
      expect(service.isAuthenticated()).toBe(false);
    });
  });

  describe('refreshToken', () => {
    it('should refresh tokens successfully', async () => {
      // Given I have a service with refresh token
      mockCookies.getCookie
        .mockReturnValueOnce('access-token')
        .mockReturnValueOnce('refresh-token')
        .mockReturnValueOnce((Date.now() + 3600000).toString())
        .mockReturnValueOnce('streaming user-read-email');

      const service = new SpotifyAuthService(mockConfig);

      const mockRefreshResponse = {
        access_token: 'new-access-token',
        token_type: 'Bearer',
        expires_in: 3600,
        scope: 'streaming user-read-email',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockRefreshResponse),
      } as Response);

      // When I refresh the token
      await service.refreshToken();

      // Then it should call the token endpoint with refresh token
      expect(mockFetch).toHaveBeenCalledWith(
        'https://accounts.spotify.com/api/token',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: expect.stringContaining('grant_type=refresh_token'),
        })
      );
    });

    it('should throw error when no refresh token', async () => {
      // Given I have no refresh token
      // When I try to refresh the token
      // Then it should throw an error
      await expect(authService.refreshToken()).rejects.toThrow(
        'No refresh token available'
      );
    });

    it('should throw error on refresh failure', async () => {
      // Given I have a refresh token but the refresh will fail
      mockCookies.getCookie
        .mockReturnValueOnce('access-token')
        .mockReturnValueOnce('refresh-token')
        .mockReturnValueOnce((Date.now() + 3600000).toString())
        .mockReturnValueOnce('streaming user-read-email');

      const service = new SpotifyAuthService(mockConfig);

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: () => Promise.resolve('Invalid refresh token'),
      } as Response);

      // When I try to refresh the token
      // Then it should throw an error
      await expect(service.refreshToken()).rejects.toThrow(
        'Refresh token is invalid or expired'
      );
    });
  });
});
