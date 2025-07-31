import {
  MusicService,
  MockMusicService,
  SpotifyMusicService,
} from '@/modules/music/services/MusicService';
import { AuthService } from '@/modules/auth';

/**
 * Provider for creating MusicService instances with proper dependencies
 */
export class MusicServiceProvider {
  private static instance: MusicService | null = null;

  /**
   * Get a singleton instance of MusicService
   * @param authService - Required for real Spotify integration
   * @param useMockService - Whether to use mock service (default: false)
   */
  static getOrCreate(
    authService?: AuthService,
    useMockService = false
  ): MusicService {
    if (!this.instance) {
      this.instance =
        useMockService || !authService
          ? new MockMusicService(undefined)
          : new SpotifyMusicService(authService);
    }
    return this.instance;
  }

  /**
   * Create a new MusicService instance for testing
   */
  static createForTesting(mockService: MusicService): MusicService {
    return mockService;
  }

  /**
   * Reset the singleton instance (useful for testing)
   */
  static reset(): void {
    this.instance = null;
  }
}
