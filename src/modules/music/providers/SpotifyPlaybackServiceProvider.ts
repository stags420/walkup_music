import type { SpotifyPlaybackService } from '@/modules/music/services/impl/SpotifyPlaybackService';
import {
  SpotifyPlaybackServiceImpl,
  MockSpotifyPlaybackService,
} from '@/modules/music/services/impl/SpotifyPlaybackService';
import { AppConfigProvider } from '@/modules/app';
import { AuthServiceProvider } from '@/modules/auth/providers/AuthServiceProvider';

/**
 * Provider for creating SpotifyPlaybackService instances with proper dependencies
 */
export class SpotifyPlaybackServiceProvider {
  private static instance: SpotifyPlaybackService | undefined = undefined;

  /**
   * Get a singleton instance of SpotifyPlaybackService
   */
  static getOrCreate(): SpotifyPlaybackService {
    if (!this.instance) {
      const appConfig = AppConfigProvider.get();
      this.instance = appConfig.mockAuth
        ? new MockSpotifyPlaybackService()
        : new SpotifyPlaybackServiceImpl(AuthServiceProvider.getOrCreate());
    }
    return this.instance;
  }

  /**
   * Create a new SpotifyPlaybackService instance for testing
   */
  static createForTesting(
    mockService: SpotifyPlaybackService
  ): SpotifyPlaybackService {
    return mockService;
  }

  /**
   * Reset the singleton instance (useful for testing)
   */
  static reset(): void {
    this.instance = undefined;
  }
}
