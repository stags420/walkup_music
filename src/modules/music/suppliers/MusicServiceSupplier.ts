import type { MusicService } from '@/modules/music/services/MusicService';
import { MockMusicService } from '@/modules/music/services/MusicService';
import { SpotifyMusicService } from '@/modules/music/services/impl/SpotifyMusicService';
import type { SpotifyTrack } from '@/modules/music/models/SpotifyTrack';
import { AppConfigSupplier } from '@/modules/app/suppliers/AppConfigSupplier';
import { supplySpotifyApiService } from '@/modules/music/suppliers/SpotifyApiServiceSupplier';
import { supplySpotifyPlaybackService } from '@/modules/music/suppliers/SpotifyPlaybackServiceSupplier';

let singleton: MusicService | undefined;
let injectedMockTracks: SpotifyTrack[] | undefined;

export function supplyMusicService(): MusicService {
  if (!singleton) {
    const shouldUseMock = AppConfigSupplier.get().mockAuth;
    const playback = supplySpotifyPlaybackService();
    if (shouldUseMock) {
      const testTracks = (
        globalThis as { __TEST_MOCK_TRACKS__?: SpotifyTrack[] }
      ).__TEST_MOCK_TRACKS__;
      const tracksToUse = testTracks || injectedMockTracks;
      singleton = new MockMusicService(playback, tracksToUse);
    } else {
      singleton = new SpotifyMusicService(supplySpotifyApiService(), playback);
    }
  }
  return singleton;
}

export function injectMockTracksForTests(tracks: SpotifyTrack[]): void {
  injectedMockTracks = tracks;
  resetMusicServiceForTests();
}

export function resetMusicServiceForTests(): void {
  singleton = undefined;
}
