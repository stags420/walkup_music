import type { AppContainer } from '@/modules/app/models/AppContainer';
import { AppConfigProvider } from '@/modules/app';
import { FetchHttpService } from '@/modules/core/services/impl/FetchHttpService';
import { MockAuthService } from '@/modules/auth/services/impl/MockAuthService';
import { SpotifyAuthService } from '@/modules/auth/services/impl/SpotifyAuthService';
import { LocalStorageService } from '@/modules/storage/services/impl/LocalStorageService';
import { PlayerService } from '@/modules/game/services/PlayerService';
import { SpotifyApiService } from '@/modules/music/services/impl/SpotifyApiService';
import {
  MockSpotifyPlaybackService,
  SpotifyPlaybackServiceImpl,
} from '@/modules/music/services/impl/SpotifyPlaybackService';
import { SpotifyMusicService } from '@/modules/music/services/impl/SpotifyMusicService';
import { MockMusicService } from '@/modules/music/services/MusicService';
import type { SpotifyTrack } from '@/modules/music/models/SpotifyTrack';
import type { SpotifyPlaybackService } from '@/modules/music/services/impl/SpotifyPlaybackService';
import type { MusicService } from '@/modules/music/services/MusicService';
import { LineupServiceImpl } from '@/modules/game/services/LineupService';

export class ApplicationContainerProvider {
  private static instance: AppContainer | null = null;
  private static isInitialized = false;

  static initialize(): void {
    if (this.isInitialized) return;
    const config = AppConfigProvider.get();
    const httpService = new FetchHttpService();

    // Auth service
    const authService = config.mockAuth
      ? new MockAuthService()
      : new SpotifyAuthService(config);

    // Storage (temporary until Zustand-backed persistence replaces it)
    const storageService = new LocalStorageService();

    // Game services
    const playerService = new PlayerService(storageService);

    // Music services
    const spotifyApiService = new SpotifyApiService(authService, httpService);
    const spotifyPlaybackService: SpotifyPlaybackService = config.mockAuth
      ? new MockSpotifyPlaybackService()
      : new SpotifyPlaybackServiceImpl(authService);

    // In mock mode (used in preview/E2E), use MockMusicService with optional injected tracks
    const injectedTestTracks = (
      globalThis as unknown as { __TEST_MOCK_TRACKS__?: SpotifyTrack[] }
    ).__TEST_MOCK_TRACKS__;

    const musicService: MusicService = config.mockAuth
      ? new MockMusicService(spotifyPlaybackService, injectedTestTracks)
      : new SpotifyMusicService(spotifyApiService, spotifyPlaybackService);

    // Lineup service
    const lineupService = new LineupServiceImpl(
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
