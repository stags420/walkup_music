import { ApplicationContainerProvider } from '@/modules/app';
import type { AuthService } from '@/modules/auth/services/AuthService';
import type { MusicService } from '@/modules/music/services/MusicService';
import type { AppConfig } from '@/modules/app/models/AppConfig';

export function useAppConfig(): AppConfig {
  return ApplicationContainerProvider.get().config;
}

export function useAuthService(): AuthService {
  return ApplicationContainerProvider.get().authService;
}

export function useMusicService(): MusicService {
  return ApplicationContainerProvider.get().musicService;
}
