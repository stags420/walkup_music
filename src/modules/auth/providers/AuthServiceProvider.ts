// Singleton service provider for AuthService following React concepts guidance
import { AuthService } from '@/modules/auth';
import { SpotifyAuthService } from '@/modules/auth/services/SpotifyAuthService';
import { appConfigProvider } from '@/modules/config';

/**
 * Singleton service provider for AuthService
 * Use this for stateless singleton services - NOT React Context
 *
 * Usage: const authService = authServiceProvider.getOrCreate();
 */
class AuthServiceProvider {
  private instance: AuthService | null = null;

  getOrCreate(): AuthService {
    if (!this.instance) {
      // Get config from global config singleton
      const config = appConfigProvider.get();
      this.instance = new SpotifyAuthService(config);
    }
    return this.instance;
  }

  /**
   * Create a new instance for testing
   * @param mockService - Mock service for testing
   */
  createForTesting(mockService: AuthService): AuthService {
    return mockService;
  }

  /**
   * Reset the singleton instance (useful for testing)
   */
  reset(): void {
    this.instance = null;
  }
}

// Export a singleton instance of the provider
const authServiceProvider = new AuthServiceProvider();

export default authServiceProvider;
export { AuthServiceProvider };
