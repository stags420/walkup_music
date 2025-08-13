import type { AppContainer } from '@/modules/app/models/AppContainer';
import { AppConfigProvider } from '@/modules/app';
import type { SpotifyTrack } from '@/modules/music/models/SpotifyTrack';
import type { MusicService } from '@/modules/music/services/MusicService';
import { HttpServiceProvider } from '@/modules/core/providers/HttpServiceProvider';
import { AuthServiceProvider } from '@/modules/auth/providers/AuthServiceProvider';
import { MusicServiceProvider } from '@/modules/music/providers/MusicServiceProvider';

export class ApplicationContainerProvider {
  private static instance: AppContainer | undefined = undefined;
  private static isInitialized = false;

  static initialize(): void {
    if (this.isInitialized) return;
    const config = AppConfigProvider.get();
    const httpService = HttpServiceProvider.getOrCreate();

    const authService = AuthServiceProvider.getOrCreate();

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
    const musicService: MusicService = MusicServiceProvider.getOrCreate();

    // Lineup state via Zustand hooks; no service creation

    this.instance = {
      config,
      httpService,
      authService,
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
