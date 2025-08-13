import type { SpotifyPlaybackService } from '@/modules/music/services/impl/SpotifyPlaybackService';
import {
  SpotifyPlaybackServiceImpl,
  MockSpotifyPlaybackService,
} from '@/modules/music/services/impl/SpotifyPlaybackService';
import { AppConfigSupplier } from '@/modules/app/suppliers/AppConfigSupplier';
import { supplyAuthService } from '@/modules/auth/suppliers/AuthServiceSupplier';

let singleton: SpotifyPlaybackService | undefined;

export function supplySpotifyPlaybackService(): SpotifyPlaybackService {
  if (!singleton) {
    const config = AppConfigSupplier.get();
    singleton = config.mockAuth
      ? new MockSpotifyPlaybackService()
      : new SpotifyPlaybackServiceImpl(supplyAuthService());
  }
  return singleton;
}

export function resetSpotifyPlaybackServiceForTests(): void {
  singleton = undefined;
}
