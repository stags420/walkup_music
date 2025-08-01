import { AuthService } from './AuthService';

/**
 * Mock authentication service that bypasses Spotify OAuth for development/testing
 */
export class MockAuthService implements AuthService {
  private authenticated = false;
  private mockUser = {
    id: 'mock-user-123',
    email: 'mock@example.com',
    displayName: 'Mock User',
  };

  async login(): Promise<void> {
    // Simulate async login
    await new Promise((resolve) => setTimeout(resolve, 100));
    this.authenticated = true;
  }

  async logout(): Promise<void> {
    // Simulate async logout
    await new Promise((resolve) => setTimeout(resolve, 50));
    this.authenticated = false;
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
    this.authenticated = true;
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
