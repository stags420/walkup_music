import {
  SpotifyPlaybackService,
  SpotifyPlaybackServiceImpl,
  MockSpotifyPlaybackService,
} from '@/modules/music/services/SpotifyPlaybackService';
import { AuthService } from '@/modules/auth';

/**
 * Provider for creating SpotifyPlaybackService instances with proper dependencies
 */
export class SpotifyPlaybackServiceProvider {
  private static instance: SpotifyPlaybackService | null = null;

  /**
   * Get a singleton instance of SpotifyPlaybackService
   * @param authService - Required for real Spotify integration
   * @param useMockService - Whether to use mock service (default: false)
   */
  static getOrCreate(
    authService?: AuthService,
    useMockService = false
  ): SpotifyPlaybackService {
    if (!this.instance) {
      this.instance =
        useMockService || !authService
          ? new MockSpotifyPlaybackService()
          : new SpotifyPlaybackServiceImpl(authService);
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
    this.instance = null;
  }
}
