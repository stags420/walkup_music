import type { AppConfig } from './AppConfig';
import type { HttpService } from '@/modules/core/services/HttpService';

export interface AppContainer {
  config: AppConfig;
  httpService: HttpService;
  // Add service singletons here as they are introduced (e.g., storageService, authService)
}
