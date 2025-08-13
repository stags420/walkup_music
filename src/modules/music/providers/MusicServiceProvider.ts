import type { MusicService } from '@/modules/music/services/MusicService';
import { MockMusicService } from '@/modules/music/services/MusicService';
import { SpotifyMusicService } from '@/modules/music/services/impl/SpotifyMusicService';
import type { SpotifyTrack } from '@/modules/music/models/SpotifyTrack';
import { SpotifyApiServiceProvider } from '@/modules/music/providers/SpotifyApiServiceProvider';
import { SpotifyPlaybackServiceProvider } from '@/modules/music/providers/SpotifyPlaybackServiceProvider';
import { AppConfigProvider } from '@/modules/app';

/**
 * Singleton service provider for MusicService instances
 */
export class MusicServiceProvider {
  private static instance: MusicService | undefined = undefined;
  private static mockTracks: SpotifyTrack[] | undefined = undefined;

  /**
   * Get a singleton instance of MusicService
   * @param authService - Required for real Spotify integration
   * @param useMockService - Whether to use mock service (default: false, but overridden by config.mockAuth)
   */
  static getOrCreate(): MusicService {
    if (!this.instance) {
      const shouldUseMock = AppConfigProvider.get().mockAuth;

      const playbackService = SpotifyPlaybackServiceProvider.getOrCreate();
      if (shouldUseMock) {
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

        this.instance = new MockMusicService(playbackService, tracksToUse);
      } else {
        const spotifyApiService = SpotifyApiServiceProvider.getOrCreate();
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
    this.instance = undefined;
  }
}
