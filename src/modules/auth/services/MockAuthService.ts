import { AuthService } from './AuthService';

/**
 * Mock authentication service that bypasses Spotify OAuth for development/testing
 */
export class MockAuthService implements AuthService {
  private static readonly AUTH_STATE_KEY = 'mock-auth-state';
  private mockUser = {
    id: 'mock-user-123',
    email: 'mock@example.com',
    displayName: 'Mock User',
  };

  constructor() {
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
      return savedState === 'true';
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
    console.log('MockAuthService: User logged in');
  }

  async logout(): Promise<void> {
    // Simulate async logout
    await new Promise((resolve) => setTimeout(resolve, 50));
    this.saveAuthState(false);
    console.log('MockAuthService: User logged out');
  }

  async getAccessToken(): Promise<string | null> {
    if (!this.authenticated) {
      return null;
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

  async getUserInfo(): Promise<{
    id: string;
    email: string;
    displayName: string;
  } | null> {
    if (!this.authenticated) {
      return null;
    }
    return { ...this.mockUser };
  }
}
