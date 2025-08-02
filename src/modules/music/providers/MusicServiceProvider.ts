import {
  MusicService,
  MockMusicService,
  SpotifyMusicService,
} from '@/modules/music/services/MusicService';
import { SpotifyTrack } from '@/modules/music/models/SpotifyTrack';
import { SpotifyApiServiceProvider } from './SpotifyApiServiceProvider';
import { SpotifyPlaybackServiceProvider } from './SpotifyPlaybackServiceProvider';
import { AuthService } from '@/modules/auth';
import { AppConfigProvider } from '@/modules/config';

/**
 * Singleton service provider for MusicService instances
 */
export class MusicServiceProvider {
  private static instance: MusicService | null = null;
  private static mockTracks: SpotifyTrack[] | null = null;

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
      const config = AppConfigProvider.get();
      const shouldUseMock = config.mockAuth || useMockService || !authService;

      if (shouldUseMock) {
        const mockPlaybackService = SpotifyPlaybackServiceProvider.getOrCreate(
          undefined,
          true
        );

        // Check for test-injected tracks from window object (for e2e tests)
        const testTracks = (
          globalThis as { __TEST_MOCK_TRACKS__?: SpotifyTrack[] }
        ).__TEST_MOCK_TRACKS__;
        const tracksToUse = testTracks || this.mockTracks;

        console.log('MusicServiceProvider: testTracks found?', !!testTracks);
        console.log(
          'MusicServiceProvider: using tracks count:',
          tracksToUse?.length || 'none'
        );

        this.instance = new MockMusicService(mockPlaybackService, tracksToUse);
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
   * Inject mock tracks for testing
   * @param tracks - Array of SpotifyTrack objects to use in mock mode
   */
  static injectMockTracks(tracks: SpotifyTrack[]): void {
    this.mockTracks = tracks;
    // Reset instance to force recreation with new tracks
    this.reset();
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
