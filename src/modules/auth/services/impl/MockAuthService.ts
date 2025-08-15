import type { AuthService } from '@/modules/auth/services/AuthService';
import type { AppConfig } from '@/modules/app/models/AppConfig';

/**
 * Mock authentication service that bypasses Spotify OAuth for development/testing
 */
export class MockAuthService implements AuthService {
  private static readonly AUTH_STATE_KEY = 'mock-auth-state';
  private static readonly EXPIRES_AT_KEY = 'mock-auth-expire-at';
  private mockUser = {
    id: 'mock-user-123',
    email: 'mock@example.com',
    displayName: 'Mock User',
  };

  constructor(private readonly appConfig?: AppConfig) {
    // Restore auth state from localStorage on initialization
    this.loadAuthState();
  }

  private loadAuthState(): void {
    try {
      const savedState = localStorage.getItem(MockAuthService.AUTH_STATE_KEY);
      if (savedState === 'true') {
        // Auth state was persisted, user should remain logged in
        console.log(
          'MockAuthService: Restored authenticated state from localStorage'
        );
      }
    } catch (error) {
      console.warn(
        'MockAuthService: Failed to load auth state from localStorage:',
        error
      );
    }
  }

  private saveAuthState(authenticated: boolean): void {
    try {
      localStorage.setItem(
        MockAuthService.AUTH_STATE_KEY,
        authenticated.toString()
      );
    } catch (error) {
      console.warn(
        'MockAuthService: Failed to save auth state to localStorage:',
        error
      );
    }
  }

  private get authenticated(): boolean {
    try {
      const savedState = localStorage.getItem(MockAuthService.AUTH_STATE_KEY);
      if (savedState !== 'true') return false;

      // Enforce optional expiry for tests
      const expiresAtStr = localStorage.getItem(MockAuthService.EXPIRES_AT_KEY);
      if (expiresAtStr) {
        const expiresAt = Number.parseInt(expiresAtStr, 10);
        if (!Number.isNaN(expiresAt) && Date.now() >= expiresAt) {
          // Session expired; clear and report unauthenticated
          this.saveAuthState(false);
          try {
            localStorage.removeItem(MockAuthService.EXPIRES_AT_KEY);
          } catch (error) {
            void error;
          }
          return false;
        }
      }
      return true;
    } catch (error) {
      console.warn(
        'MockAuthService: Failed to read auth state from localStorage:',
        error
      );
      return false;
    }
  }

  async login(): Promise<void> {
    // Simulate async login
    await new Promise((resolve) => setTimeout(resolve, 100));
    this.saveAuthState(true);
    // If a test session duration is configured, set expiry timestamp
    try {
      const seconds = this.appConfig?.maxTokenTtlSeconds;
      if (seconds && seconds > 0) {
        const expiresAt = Date.now() + seconds * 1000;
        localStorage.setItem(
          MockAuthService.EXPIRES_AT_KEY,
          expiresAt.toString()
        );
      } else {
        localStorage.removeItem(MockAuthService.EXPIRES_AT_KEY);
      }
    } catch (error) {
      void error;
    }
    console.log('MockAuthService: User logged in');
  }

  async logout(): Promise<void> {
    // Simulate async logout
    await new Promise((resolve) => setTimeout(resolve, 50));
    this.saveAuthState(false);
    console.log('MockAuthService: User logged out');
  }

  async getAccessToken(): Promise<string | undefined> {
    if (!this.authenticated) {
      return undefined;
    }
    return 'mock-access-token-12345';
  }

  isAuthenticated(): boolean {
    return this.authenticated;
  }

  async refreshToken(): Promise<void> {
    // Mock refresh - no-op since we don't have real tokens
    await new Promise((resolve) => setTimeout(resolve, 50));
  }

  async handleCallback(_code: string, _state: string): Promise<void> {
    // Mock callback handling - just set authenticated
    await new Promise((resolve) => setTimeout(resolve, 100));
    this.saveAuthState(true);
    console.log('MockAuthService: Handled callback, user authenticated');
  }

  async getUserInfo(): Promise<
    | {
        id: string;
        email: string;
        displayName: string;
      }
    | undefined
  > {
    if (!this.authenticated) {
      return undefined;
    }
    return { ...this.mockUser };
  }
}
