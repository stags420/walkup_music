import type { AppConfig } from './AppConfig';
import type { HttpService } from '@/modules/core/services/HttpService';
import type { AuthService } from '@/modules/auth/services/AuthService';
import type { PlayerService } from '@/modules/game/services/PlayerService';
import type { LineupService } from '@/modules/game/services/LineupService';
import type { MusicService } from '@/modules/music/services/MusicService';
import type { SpotifyApiService } from '@/modules/music/services/impl/SpotifyApiService';
import type { SpotifyPlaybackService } from '@/modules/music/services/impl/SpotifyPlaybackService';
import type { StorageService } from '@/modules/storage/services/StorageService';

export interface AppContainer {
  config: AppConfig;
  httpService: HttpService;
  // Core services wired at bootstrap
  authService: AuthService;
  storageService: StorageService;
  playerService: PlayerService;
  spotifyApiService: SpotifyApiService;
  spotifyPlaybackService: SpotifyPlaybackService;
  musicService: MusicService;
  lineupService: LineupService;
}
