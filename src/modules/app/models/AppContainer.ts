import type { AppConfig } from './AppConfig';
import type { HttpService } from '@/modules/core/services/HttpService';
import type { AuthService } from '@/modules/auth/services/AuthService';
import type { MusicService } from '@/modules/music/services/MusicService';
import type { SpotifyApiService } from '@/modules/music/services/impl/SpotifyApiService';
import type { SpotifyPlaybackService } from '@/modules/music/services/impl/SpotifyPlaybackService';

export interface AppContainer {
  config: AppConfig;
  httpService: HttpService;
  // Core services wired at bootstrap
  authService: AuthService;
  spotifyApiService: SpotifyApiService;
  spotifyPlaybackService: SpotifyPlaybackService;
  musicService: MusicService;
}
