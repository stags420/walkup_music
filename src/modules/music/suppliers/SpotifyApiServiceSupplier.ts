import { SpotifyApiService } from '@/modules/music/services/impl/SpotifyApiService';
import { supplyHttpService } from '@/modules/core/suppliers/HttpServiceSupplier';
import { supplyAuthService } from '@/modules/auth/suppliers/AuthServiceSupplier';

let singleton: SpotifyApiService | undefined;

export function supplySpotifyApiService(): SpotifyApiService {
  if (!singleton) {
    singleton = new SpotifyApiService(supplyAuthService(), supplyHttpService());
  }
  return singleton;
}

export function resetSpotifyApiServiceForTests(): void {
  singleton = undefined;
}
