import type { AppConfig } from '@/modules/config/models/AppConfig';
import { FetchHttpService } from '@/modules/core/services/impls/FetchHttpService';
import type { HttpService } from '@/modules/core/services/HttpService';

export interface AppContainer {
  config: AppConfig;
  httpService: HttpService;
  // Add service singletons here as they are introduced (e.g., storageService, authService)
}

let container: AppContainer | null = null;

export function bootstrapServices(config: AppConfig): AppContainer {
  const apiService = new FetchHttpService('');
  container = { config, httpService: apiService };
  return container;
}

export function getContainer(): AppContainer {
  if (container == null) {
    throw new Error(
      'Services not bootstrapped. Call bootstrapServices(config) at app startup.'
    );
  }
  return container;
}

// Test helper to reset container state between tests
export function __resetContainerForTests(): void {
  container = null;
}
