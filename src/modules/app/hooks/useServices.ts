import { ApplicationContainerProvider } from '@/modules/app';
import type { AuthService } from '@/modules/auth/services/AuthService';
import type { MusicService } from '@/modules/music/services/MusicService';
import type { SpotifyApiService } from '@/modules/music/services/impl/SpotifyApiService';
import type { SpotifyPlaybackService } from '@/modules/music/services/impl/SpotifyPlaybackService';
import type { AppConfig } from '@/modules/app/models/AppConfig';

export function useAppConfig(): AppConfig {
  return ApplicationContainerProvider.get().config;
}

export function useAuthService(): AuthService {
  return ApplicationContainerProvider.get().authService;
}

// Storage service removed; use module-local Zustand/TanStack hooks instead

export function useSpotifyApiService(): SpotifyApiService {
  return ApplicationContainerProvider.get().spotifyApiService;
}

export function useSpotifyPlaybackService(): SpotifyPlaybackService {
  return ApplicationContainerProvider.get().spotifyPlaybackService;
}

export function useMusicService(): MusicService {
  return ApplicationContainerProvider.get().musicService;
}

// Player and lineup services removed; use game hooks instead
