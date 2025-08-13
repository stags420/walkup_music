import { SpotifyApiService } from '@/modules/music/services/impl/SpotifyApiService';
import { HttpServiceProvider } from '@/modules/core/providers/HttpServiceProvider';
import { AuthServiceProvider } from '@/modules/auth/providers/AuthServiceProvider';

/**
 * Provider for creating SpotifyApiService instances with proper dependencies
 */
export class SpotifyApiServiceProvider {
  private static instance: SpotifyApiService | undefined = undefined;

  /**
   * Get a singleton instance of SpotifyApiService
   */
  static getOrCreate(): SpotifyApiService {
    if (!this.instance) {
      this.instance = new SpotifyApiService(
        AuthServiceProvider.getOrCreate(),
        HttpServiceProvider.getOrCreate()
      );
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
    this.instance = undefined;
  }
}
