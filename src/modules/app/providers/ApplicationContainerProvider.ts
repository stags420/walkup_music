import type { AppContainer } from '@/modules/app/models/AppContainer';
import { AppConfigProvider } from '@/modules/app';
import type { SpotifyTrack } from '@/modules/music/models/SpotifyTrack';
import type { MusicService } from '@/modules/music/services/MusicService';
import type { SpotifyPlaybackService } from '@/modules/music/services/impl/SpotifyPlaybackService';
import { HttpServiceProvider } from '@/modules/core/providers/HttpServiceProvider';
import { AuthServiceProvider } from '@/modules/auth/providers/AuthServiceProvider';
import { SpotifyApiServiceProvider } from '@/modules/music/providers/SpotifyApiServiceProvider';
import { SpotifyPlaybackServiceProvider } from '@/modules/music/providers/SpotifyPlaybackServiceProvider';
import { MusicServiceProvider } from '@/modules/music/providers/MusicServiceProvider';

export class ApplicationContainerProvider {
  private static instance: AppContainer | undefined = undefined;
  private static isInitialized = false;

  static initialize(): void {
    if (this.isInitialized) return;
    const config = AppConfigProvider.get();
    const httpService = HttpServiceProvider.getOrCreate();

    // Auth service via provider
    const authService = AuthServiceProvider.getOrCreate();

    // Storage removed; using Zustand/TanStack for state

    // Game state via Zustand hooks; no service creation

    // Music service dependencies via providers
    const spotifyApiService =
      SpotifyApiServiceProvider.getOrCreate(authService);
    const spotifyPlaybackService: SpotifyPlaybackService =
      SpotifyPlaybackServiceProvider.getOrCreate(authService, config.mockAuth);

    // In mock mode (used in preview/E2E), MusicServiceProvider reads test-injected tracks
    const injectedTestTracks = (
      globalThis as unknown as { __TEST_MOCK_TRACKS__?: SpotifyTrack[] }
    ).__TEST_MOCK_TRACKS__;

    if (injectedTestTracks?.length) {
      // Make available to provider; provider resets on injection
      MusicServiceProvider.injectMockTracks?.(
        injectedTestTracks as SpotifyTrack[]
      );
    }
    const musicService: MusicService = MusicServiceProvider.getOrCreate(
      authService,
      config.mockAuth
    );

    // Lineup state via Zustand hooks; no service creation

    this.instance = {
      config,
      httpService,
      authService,
      spotifyApiService,
      spotifyPlaybackService,
      musicService,
    };
    this.isInitialized = true;
  }

  static get(): AppContainer {
    if (!this.instance || !this.isInitialized) {
      throw new Error(
        'ApplicationContainer not initialized. Call ApplicationContainerProvider.initialize() after AppConfigProvider.initialize(config).'
      );
    }
    return this.instance;
  }

  static reset(): void {
    this.instance = undefined;
    this.isInitialized = false;
  }
}
