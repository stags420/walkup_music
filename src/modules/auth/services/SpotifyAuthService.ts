import {
  AuthService,
  SpotifyTokenResponse,
  SpotifyTokens,
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
import { AppConfig } from '@/modules/config';

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
    });

    setCookie(SpotifyAuthService.COOKIE_NAMES.STATE, state, {
      maxAge: 600, // 10 minutes
      secure: isSecure,
      sameSite: 'lax',
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

    // Clean up temporary cookies
    deleteCookie(SpotifyAuthService.COOKIE_NAMES.CODE_VERIFIER);
    deleteCookie(SpotifyAuthService.COOKIE_NAMES.STATE);

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

    // Clear all auth-related cookies
    Object.values(SpotifyAuthService.COOKIE_NAMES).forEach((cookieName) => {
      deleteCookie(cookieName);
    });
  }

  /**
   * Gets the current access token, refreshing if necessary
   */
  async getAccessToken(): Promise<string | null> {
    if (!this.tokens) {
      return null;
    }

    // Check if token is expired (with 5-minute buffer)
    const now = Date.now();
    const bufferMs = 5 * 60 * 1000; // 5 minutes

    if (now >= this.tokens.expiresAt - bufferMs) {
      try {
        await this.refreshToken();
      } catch (error) {
        console.info('Failed to refresh token:', error);
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

    const response = await fetch(SpotifyAuthService.SPOTIFY_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Token refresh failed: ${response.status} ${errorText}`);
    }

    const tokenData = await response.json();
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

    const response = await fetch(SpotifyAuthService.SPOTIFY_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Token exchange failed: ${response.status} ${errorText}`);
    }

    const tokenData = await response.json();
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

    const response = await fetch(SpotifyAuthService.SPOTIFY_PROFILE_URL, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch user profile: ${response.status}`);
    }

    const profileData = await response.json();
    const profile = SpotifyUserProfile.fromExternalData(profileData);

    if (profile.product !== 'premium') {
      throw new Error(
        'Spotify Premium subscription is required to use this application'
      );
    }
  }
}
