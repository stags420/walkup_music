import {
  MusicService,
  MockMusicService,
  SpotifyMusicService,
} from '@/modules/music/services/MusicService';
import { SpotifyApiServiceProvider } from './SpotifyApiServiceProvider';
import { SpotifyPlaybackServiceProvider } from './SpotifyPlaybackServiceProvider';
import { AuthService } from '@/modules/auth';
import { appConfigProvider } from '@/modules/config';

/**
 * Provider for creating MusicService instances with proper dependencies
 */
export class MusicServiceProvider {
  private static instance: MusicService | null = null;

  /**
   * Get a singleton instance of MusicService
   * @param authService - Required for real Spotify integration
   * @param useMockService - Whether to use mock service (default: false, but overridden by config.mockAuth)
   */
  static getOrCreate(
    authService?: AuthService,
    useMockService = false
  ): MusicService {
    if (!this.instance) {
      // Check if mock auth is enabled in config
      const config = appConfigProvider.get();
      const shouldUseMock = config.mockAuth || useMockService || !authService;

      if (shouldUseMock) {
        const mockPlaybackService = SpotifyPlaybackServiceProvider.getOrCreate(
          undefined,
          true
        );
        this.instance = new MockMusicService(mockPlaybackService);
      } else {
        const spotifyApiService =
          SpotifyApiServiceProvider.getOrCreate(authService);
        const playbackService = SpotifyPlaybackServiceProvider.getOrCreate(
          authService,
          false
        );
        this.instance = new SpotifyMusicService(
          spotifyApiService,
          playbackService
        );
      }
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
