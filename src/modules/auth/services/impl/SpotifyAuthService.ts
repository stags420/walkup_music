import type { AuthService, SpotifyTokens } from '@/modules/auth';
import {
  SpotifyTokenResponse,
  SpotifyUserProfile,
  generateCodeVerifier,
  generateCodeChallenge,
  generateState,
} from '@/modules/auth';
import {
  areCookiesAvailable,
  setCookie,
  getCookie,
  deleteCookie,
} from '@/modules/auth/utils/cookies';
import type { AppConfig } from '@/modules/config';
import { getContainer } from '@/container';

/**
 * Spotify authentication service implementing PKCE OAuth 2.0 flow
 */
export class SpotifyAuthService implements AuthService {
  private static readonly SPOTIFY_AUTH_URL =
    'https://accounts.spotify.com/authorize';
  private static readonly SPOTIFY_TOKEN_URL =
    'https://accounts.spotify.com/api/token';
  private static readonly SPOTIFY_PROFILE_URL = 'https://api.spotify.com/v1/me';

  private static readonly REQUIRED_SCOPES = [
    'streaming',
    'user-read-email',
    'user-read-private',
    'user-modify-playback-state',
    'user-read-playback-state',
  ];

  private static readonly COOKIE_NAMES = {
    ACCESS_TOKEN: 'spotify_access_token',
    REFRESH_TOKEN: 'spotify_refresh_token',
    EXPIRES_AT: 'spotify_expires_at',
    SCOPE: 'spotify_scope',
    CODE_VERIFIER: 'spotify_code_verifier',
    STATE: 'spotify_state',
  };

  private tokens: SpotifyTokens | null = null;

  constructor(private config: AppConfig) {
    if (!areCookiesAvailable()) {
      console.warn(
        'Cookies are not available. Authentication may not work properly.'
      );
    }

    // Load existing tokens from cookies on initialization
    this.loadTokensFromCookies();
  }

  /**
   * Initiates the Spotify OAuth login flow
   */
  async login(): Promise<void> {
    const codeVerifier = generateCodeVerifier();
    const codeChallenge = await generateCodeChallenge(codeVerifier);
    const state = generateState();

    // Store PKCE parameters in cookies for the callback
    const isSecure = globalThis.location.protocol === 'https:';

    setCookie(SpotifyAuthService.COOKIE_NAMES.CODE_VERIFIER, codeVerifier, {
      maxAge: 600, // 10 minutes
      secure: isSecure,
      sameSite: 'lax', // Allow cross-site for OAuth callback
      path: this.config.basePath || '/', // Consistent path for OAuth flow
    });

    setCookie(SpotifyAuthService.COOKIE_NAMES.STATE, state, {
      maxAge: 600, // 10 minutes
      secure: isSecure,
      sameSite: 'lax',
      path: this.config.basePath || '/', // Consistent path for OAuth flow
    });

    // Build authorization URL
    const params = new URLSearchParams({
      client_id: this.config.spotifyClientId,
      response_type: 'code',
      redirect_uri: this.config.redirectUri,
      code_challenge_method: 'S256',
      code_challenge: codeChallenge,
      state,
      scope: SpotifyAuthService.REQUIRED_SCOPES.join(' '),
    });

    const authUrl = `${SpotifyAuthService.SPOTIFY_AUTH_URL}?${params.toString()}`;

    // Redirect to Spotify authorization
    globalThis.location.href = authUrl;
  }

  /**
   * Handles the OAuth callback and exchanges code for tokens
   */
  async handleCallback(code: string, state: string): Promise<void> {
    // Verify state parameter
    const storedState = getCookie(SpotifyAuthService.COOKIE_NAMES.STATE);
    if (!storedState || storedState !== state) {
      throw new Error('Invalid state parameter. Possible CSRF attack.');
    }

    // Get code verifier
    const codeVerifier = getCookie(
      SpotifyAuthService.COOKIE_NAMES.CODE_VERIFIER
    );
    if (!codeVerifier) {
      throw new Error(
        'Code verifier not found. Please restart the login process.'
      );
    }

    // Clean up temporary cookies using the same path they were stored with
    const cookiePath = this.config.basePath || '/';
    deleteCookie(SpotifyAuthService.COOKIE_NAMES.CODE_VERIFIER, cookiePath);
    deleteCookie(SpotifyAuthService.COOKIE_NAMES.STATE, cookiePath);

    // Exchange code for tokens
    const tokenResponse = await this.exchangeCodeForTokens(code, codeVerifier);

    // Store tokens
    this.storeTokens(tokenResponse);

    // Verify user has Spotify Premium
    await this.verifyPremiumSubscription();
  }

  /**
   * Logs out the user by clearing all stored tokens
   */
  async logout(): Promise<void> {
    this.tokens = null;

    // Clear all auth-related cookies using the same path they were stored with
    const cookiePath = this.config.basePath || '/';
    Object.values(SpotifyAuthService.COOKIE_NAMES).forEach((cookieName) => {
      deleteCookie(cookieName, cookiePath);
    });
  }

  /**
   * Gets the current access token, refreshing if necessary
   */
  async getAccessToken(): Promise<string | null> {
    if (!this.tokens) {
      return null;
    }

    // Check if token is expired (with configurable buffer)
    const now = Date.now();
    const bufferMs = this.config.tokenRefreshBufferMinutes * 60 * 1000; // Convert minutes to milliseconds

    if (now >= this.tokens.expiresAt - bufferMs) {
      try {
        await this.refreshToken();
      } catch (error) {
        console.info('Failed to refresh token:', error);
        // Clear invalid tokens and logout
        await this.logout();
        return null;
      }
    }

    return this.tokens?.accessToken || null;
  }

  /**
   * Checks if the user is currently authenticated
   */
  isAuthenticated(): boolean {
    if (!this.tokens) {
      return false;
    }

    // Check if token is not expired
    const now = Date.now();
    return now < this.tokens.expiresAt;
  }

  /**
   * Refreshes the access token using the refresh token
   */
  async refreshToken(): Promise<void> {
    if (!this.tokens?.refreshToken) {
      throw new Error('No refresh token available');
    }

    const params = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: this.tokens.refreshToken,
      client_id: this.config.spotifyClientId,
    });

    const { httpService } = getContainer();
    const { data, status } = await httpService.post<Record<string, unknown>>(
      SpotifyAuthService.SPOTIFY_TOKEN_URL,
      Object.fromEntries(params.entries())
    );

    if (status < 200 || status >= 300) {
      console.error(`Token refresh failed: ${status}`);
      if (status === 400 || status === 401) {
        throw new Error('Refresh token is invalid or expired');
      }
      throw new Error(`Token refresh failed: ${status}`);
    }

    const tokenData = data;
    const tokenResponse = SpotifyTokenResponse.fromExternalData(tokenData);

    // Update tokens (refresh token might not be included in refresh response)
    const updatedTokens: SpotifyTokens = {
      accessToken: tokenResponse.access_token,
      refreshToken: tokenResponse.refresh_token || this.tokens.refreshToken,
      expiresAt: Date.now() + tokenResponse.expires_in * 1000,
      scope: tokenResponse.scope,
    };

    this.tokens = updatedTokens;
    this.saveTokensToCookies();
  }

  /**
   * Exchanges authorization code for access tokens
   */
  private async exchangeCodeForTokens(
    code: string,
    codeVerifier: string
  ): Promise<SpotifyTokenResponse> {
    const params = new URLSearchParams({
      client_id: this.config.spotifyClientId,
      grant_type: 'authorization_code',
      code,
      redirect_uri: this.config.redirectUri,
      code_verifier: codeVerifier,
    });

    const { httpService } = getContainer();
    const { data: tokenData } = await httpService.post<Record<string, unknown>>(
      SpotifyAuthService.SPOTIFY_TOKEN_URL,
      Object.fromEntries(params.entries())
    );
    return SpotifyTokenResponse.fromExternalData(tokenData);
  }

  /**
   * Stores tokens in memory and cookies
   */
  private storeTokens(tokenResponse: SpotifyTokenResponse): void {
    const expiresAt = Date.now() + tokenResponse.expires_in * 1000;

    this.tokens = {
      accessToken: tokenResponse.access_token,
      refreshToken: tokenResponse.refresh_token,
      expiresAt,
      scope: tokenResponse.scope,
    };

    this.saveTokensToCookies();
  }

  /**
   * Saves tokens to secure cookies
   */
  private saveTokensToCookies(): void {
    if (!this.tokens) return;

    const isSecure = globalThis.location.protocol === 'https:';
    const cookieOptions = {
      secure: isSecure,
      sameSite: 'strict' as const,
      maxAge: 3600, // 1 hour
      path: this.config.basePath || '/', // Explicitly set path to match app base path
    };

    setCookie(
      SpotifyAuthService.COOKIE_NAMES.ACCESS_TOKEN,
      this.tokens.accessToken,
      cookieOptions
    );
    setCookie(
      SpotifyAuthService.COOKIE_NAMES.EXPIRES_AT,
      this.tokens.expiresAt.toString(),
      cookieOptions
    );
    setCookie(
      SpotifyAuthService.COOKIE_NAMES.SCOPE,
      this.tokens.scope,
      cookieOptions
    );

    if (this.tokens.refreshToken) {
      setCookie(
        SpotifyAuthService.COOKIE_NAMES.REFRESH_TOKEN,
        this.tokens.refreshToken,
        {
          ...cookieOptions,
          maxAge: 30 * 24 * 3600, // 30 days
        }
      );
    }
  }

  /**
   * Loads tokens from cookies on initialization
   */
  private loadTokensFromCookies(): void {
    const accessToken = getCookie(SpotifyAuthService.COOKIE_NAMES.ACCESS_TOKEN);
    const refreshToken = getCookie(
      SpotifyAuthService.COOKIE_NAMES.REFRESH_TOKEN
    );
    const expiresAtStr = getCookie(SpotifyAuthService.COOKIE_NAMES.EXPIRES_AT);
    const scope = getCookie(SpotifyAuthService.COOKIE_NAMES.SCOPE);

    if (accessToken && expiresAtStr && scope) {
      const expiresAt = parseInt(expiresAtStr, 10);

      if (!isNaN(expiresAt)) {
        this.tokens = {
          accessToken,
          refreshToken: refreshToken || undefined,
          expiresAt,
          scope,
        };
      }
    }
  }

  /**
   * Verifies that the user has a Spotify Premium subscription
   */
  private async verifyPremiumSubscription(): Promise<void> {
    const accessToken = await this.getAccessToken();
    if (!accessToken) {
      throw new Error('No access token available for premium verification');
    }

    const { httpService } = getContainer();
    const { data, status } = await httpService.get<Record<string, unknown>>(
      SpotifyAuthService.SPOTIFY_PROFILE_URL,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    if (status < 200 || status >= 300) {
      throw new Error(`Failed to fetch user profile: ${status}`);
    }

    const profileData = data;
    const profile = SpotifyUserProfile.fromExternalData(profileData);

    if (profile.product !== 'premium') {
      throw new Error(
        'Spotify Premium subscription is required to use this application'
      );
    }
  }

  /**
   * Gets user information from Spotify API
   */
  async getUserInfo(): Promise<{
    id: string;
    email: string;
    displayName: string;
  } | null> {
    if (!this.isAuthenticated()) {
      return null;
    }

    try {
      const accessToken = await this.getAccessToken();
      if (!accessToken) {
        return null;
      }

      const { httpService } = getContainer();
      const { data, status } = await httpService.get<Record<string, unknown>>(
        SpotifyAuthService.SPOTIFY_PROFILE_URL,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );

      if (status === 401) {
        console.error('Access token is invalid, clearing authentication');
        await this.logout();
        return null;
      }
      if (status < 200 || status >= 300) {
        throw new Error(`Failed to fetch user profile: ${status}`);
      }

      const profileData = data;
      const profile = SpotifyUserProfile.fromExternalData(profileData);

      return {
        id: profile.id,
        email: profile.email,
        displayName: profile.display_name,
      };
    } catch (error) {
      console.error('Failed to get user info:', error);
      // If there's an error getting user info, clear authentication
      await this.logout();
      return null;
    }
  }
}
