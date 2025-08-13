import type { AuthService } from '@/modules/auth';
import { SpotifyAuthService } from '@/modules/auth/services/impl/SpotifyAuthService';
import { MockAuthService } from '@/modules/auth/services/impl/MockAuthService';
import { AppConfigProvider } from '@/modules/app';

/**
 * Provider for creating AuthService instances with proper dependencies
 */
export class AuthServiceProvider {
  private static instance: AuthService | undefined = undefined;

  /**
   * Get a singleton instance of AuthService with AppConfig
   */
  static getOrCreate(): AuthService {
    if (!this.instance) {
      // Get config from global config singleton
      const config = AppConfigProvider.get();

      this.instance = config.mockAuth
        ? new MockAuthService()
        : new SpotifyAuthService(config);
    }
    return this.instance;
  }

  /**
   * Create a new AuthService instance for testing
   */
  static createForTesting(mockService: AuthService): AuthService {
    return mockService;
  }

  /**
   * Reset the singleton instance (useful for testing)
   */
  static reset(): void {
    this.instance = undefined;
  }
}
