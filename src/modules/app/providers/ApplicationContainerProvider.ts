import type { AppContainer } from '@/modules/app/models/AppContainer';
import { AppConfigProvider } from '@/modules/app';
import type { SpotifyTrack } from '@/modules/music/models/SpotifyTrack';
import type { MusicService } from '@/modules/music/services/MusicService';
import type { SpotifyPlaybackService } from '@/modules/music/services/impl/SpotifyPlaybackService';
import { HttpServiceProvider } from '@/modules/core/providers/HttpServiceProvider';
import { AuthServiceProvider } from '@/modules/auth/providers/AuthServiceProvider';
import { StorageServiceProvider } from '@/modules/storage';
import { PlayerServiceProvider } from '@/modules/game/providers/PlayerServiceProvider';
import { SpotifyApiServiceProvider } from '@/modules/music/providers/SpotifyApiServiceProvider';
import { SpotifyPlaybackServiceProvider } from '@/modules/music/providers/SpotifyPlaybackServiceProvider';
import { MusicServiceProvider } from '@/modules/music/providers/MusicServiceProvider';
import { LineupServiceProvider } from '@/modules/game/providers/LineupServiceProvider';

export class ApplicationContainerProvider {
  private static instance: AppContainer | null = null;
  private static isInitialized = false;

  static initialize(): void {
    if (this.isInitialized) return;
    const config = AppConfigProvider.get();
    const httpService = HttpServiceProvider.getOrCreate();

    // Auth service via provider
    const authService = AuthServiceProvider.getOrCreate();

    // Storage via provider
    const storageService = StorageServiceProvider.getOrCreate();

    // Game services via provider
    const playerService = PlayerServiceProvider.getOrCreate();

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

    // Lineup service via provider
    const lineupService = LineupServiceProvider.getOrCreate(
      playerService,
      musicService,
      storageService
    );

    this.instance = {
      config,
      httpService,
      authService,
      storageService,
      playerService,
      spotifyApiService,
      spotifyPlaybackService,
      musicService,
      lineupService,
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
    this.instance = null;
    this.isInitialized = false;
  }
}
