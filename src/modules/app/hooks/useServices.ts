import { ApplicationContainerProvider } from '@/modules/app';
import type { AuthService } from '@/modules/auth/services/AuthService';
import type { PlayerService } from '@/modules/game/services/PlayerService';
import type { LineupService } from '@/modules/game/services/LineupService';
import type { MusicService } from '@/modules/music/services/MusicService';
import type { SpotifyApiService } from '@/modules/music/services/impl/SpotifyApiService';
import type { SpotifyPlaybackService } from '@/modules/music/services/impl/SpotifyPlaybackService';
import type { StorageService } from '@/modules/storage/services/StorageService';
import type { AppConfig } from '@/modules/app/models/AppConfig';

export function useAppConfig(): AppConfig {
  return ApplicationContainerProvider.get().config;
}

export function useAuthService(): AuthService {
  return ApplicationContainerProvider.get().authService;
}

export function useStorageService(): StorageService {
  return ApplicationContainerProvider.get().storageService;
}

export function usePlayerService(): PlayerService {
  return ApplicationContainerProvider.get().playerService;
}

export function useSpotifyApiService(): SpotifyApiService {
  return ApplicationContainerProvider.get().spotifyApiService;
}

export function useSpotifyPlaybackService(): SpotifyPlaybackService {
  return ApplicationContainerProvider.get().spotifyPlaybackService;
}

export function useMusicService(): MusicService {
  return ApplicationContainerProvider.get().musicService;
}

export function useLineupService(): LineupService {
  return ApplicationContainerProvider.get().lineupService;
}
