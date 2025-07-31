import { SpotifyApiService } from '@/modules/music/services/SpotifyApiService';
import { AuthService } from '@/modules/auth';

/**
 * Provider for creating SpotifyApiService instances with proper dependencies
 */
export class SpotifyApiServiceProvider {
  private static instance: SpotifyApiService | null = null;

  /**
   * Get a singleton instance of SpotifyApiService
   * @param authService - Required for real Spotify integration
   */
  static getOrCreate(authService: AuthService): SpotifyApiService {
    if (!this.instance) {
      this.instance = new SpotifyApiService(authService);
    }
    return this.instance;
  }

  /**
   * Create a new SpotifyApiService instance for testing
   */
  static createForTesting(mockService: SpotifyApiService): SpotifyApiService {
    return mockService;
  }

  /**
   * Reset the singleton instance (useful for testing)
   */
  static reset(): void {
    this.instance = null;
  }
}
