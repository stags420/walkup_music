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
      expect(authService).toBeInstanceOf(SpotifyAuthService);
    });

    it('should warn when cookies are not available', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      mockCookies.areCookiesAvailable.mockReturnValue(false);

      new SpotifyAuthService(mockConfig);

      expect(consoleSpy).toHaveBeenCalledWith(
        'Cookies are not available. Authentication may not work properly.'
      );

      consoleSpy.mockRestore();
    });

    it('should load existing tokens from cookies', () => {
      mockCookies.getCookie
        .mockReturnValueOnce('access-token')
        .mockReturnValueOnce('refresh-token')
        .mockReturnValueOnce((Date.now() + 3600000).toString())
        .mockReturnValueOnce('streaming user-read-email');

      const service = new SpotifyAuthService(mockConfig);

      expect(service.isAuthenticated()).toBe(true);
    });
  });

  describe('login', () => {
    it('should initiate OAuth flow with correct parameters', async () => {
      mockPkce.generateCodeVerifier.mockReturnValue('test-verifier');
      mockPkce.generateCodeChallenge.mockResolvedValue('test-challenge');
      mockPkce.generateState.mockReturnValue('test-state');

      await authService.login();

      expect(mockPkce.generateCodeVerifier).toHaveBeenCalled();
      expect(mockPkce.generateCodeChallenge).toHaveBeenCalledWith(
        'test-verifier'
      );
      expect(mockPkce.generateState).toHaveBeenCalled();

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

      await authService.handleCallback('auth-code', 'test-state');

      expect(mockCookies.deleteCookie).toHaveBeenCalledWith(
        'spotify_code_verifier'
      );
      expect(mockCookies.deleteCookie).toHaveBeenCalledWith('spotify_state');
      expect(authService.isAuthenticated()).toBe(true);
    });

    it('should throw error for invalid state', async () => {
      mockCookies.getCookie.mockReturnValueOnce('different-state');

      await expect(
        authService.handleCallback('auth-code', 'test-state')
      ).rejects.toThrow('Invalid state parameter. Possible CSRF attack.');
    });

    it('should throw error when code verifier is missing', async () => {
      mockCookies.getCookie
        .mockReturnValueOnce('test-state')
        .mockReturnValueOnce(null); // no code verifier

      await expect(
        authService.handleCallback('auth-code', 'test-state')
      ).rejects.toThrow(
        'Code verifier not found. Please restart the login process.'
      );
    });

    it('should throw error for non-premium users', async () => {
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

      await expect(
        authService.handleCallback('auth-code', 'test-state')
      ).rejects.toThrow(
        'Spotify Premium subscription is required to use this application'
      );
    });
  });

  describe('logout', () => {
    it('should clear all tokens and cookies', async () => {
      await authService.logout();

      expect(mockCookies.deleteCookie).toHaveBeenCalledTimes(6); // All cookie names
      expect(authService.isAuthenticated()).toBe(false);
    });
  });

  describe('getAccessToken', () => {
    it('should return null when not authenticated', async () => {
      const token = await authService.getAccessToken();
      expect(token).toBeNull();
    });

    it('should return valid token when authenticated', async () => {
      // Set up authenticated state
      mockCookies.getCookie
        .mockReturnValueOnce('access-token')
        .mockReturnValueOnce('refresh-token')
        .mockReturnValueOnce((Date.now() + 3600000).toString())
        .mockReturnValueOnce('streaming user-read-email');

      const service = new SpotifyAuthService(mockConfig);
      const token = await service.getAccessToken();

      expect(token).toBe('access-token');
    });

    it('should refresh token when expired', async () => {
      // Set up expired token
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

      const token = await service.getAccessToken();

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
      // Set up expired token
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

      const token = await service.getAccessToken();

      expect(token).toBeNull();
      expect(service.isAuthenticated()).toBe(false);
    });
  });

  describe('isAuthenticated', () => {
    it('should return false when no tokens', () => {
      expect(authService.isAuthenticated()).toBe(false);
    });

    it('should return true when tokens are valid', () => {
      mockCookies.getCookie
        .mockReturnValueOnce('access-token')
        .mockReturnValueOnce('refresh-token')
        .mockReturnValueOnce((Date.now() + 3600000).toString())
        .mockReturnValueOnce('streaming user-read-email');

      const service = new SpotifyAuthService(mockConfig);

      expect(service.isAuthenticated()).toBe(true);
    });

    it('should return false when tokens are expired', () => {
      mockCookies.getCookie
        .mockReturnValueOnce('access-token')
        .mockReturnValueOnce('refresh-token')
        .mockReturnValueOnce((Date.now() - 1000).toString()) // Expired
        .mockReturnValueOnce('streaming user-read-email');

      const service = new SpotifyAuthService(mockConfig);

      expect(service.isAuthenticated()).toBe(false);
    });
  });

  describe('refreshToken', () => {
    it('should refresh tokens successfully', async () => {
      // Set up service with refresh token
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

      await service.refreshToken();

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
      await expect(authService.refreshToken()).rejects.toThrow(
        'No refresh token available'
      );
    });

    it('should throw error on refresh failure', async () => {
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

      await expect(service.refreshToken()).rejects.toThrow(
        'Token refresh failed: 400 Invalid refresh token'
      );
    });
  });
});
