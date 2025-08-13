import type { AuthService } from '@/modules/auth/services/AuthService';
import { SpotifyAuthService } from '@/modules/auth/services/impl/SpotifyAuthService';
import { MockAuthService } from '@/modules/auth/services/impl/MockAuthService';
import { AppConfigSupplier } from '@/modules/app/suppliers/AppConfigSupplier';

let singleton: AuthService | undefined;

export function supplyAuthService(): AuthService {
  if (!singleton) {
    const config = AppConfigSupplier.get();
    singleton = config.mockAuth
      ? new MockAuthService()
      : new SpotifyAuthService(config);
  }
  return singleton;
}

export function resetAuthServiceForTests(): void {
  singleton = undefined;
}
