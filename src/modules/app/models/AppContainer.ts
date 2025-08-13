import type { AppConfig } from './AppConfig';
import type { HttpService } from '@/modules/core/services/HttpService';
import type { AuthService } from '@/modules/auth/services/AuthService';
import type { MusicService } from '@/modules/music/services/MusicService';

export interface AppContainer {
  config: AppConfig;
  httpService: HttpService;
  authService: AuthService;
  musicService: MusicService;
}
