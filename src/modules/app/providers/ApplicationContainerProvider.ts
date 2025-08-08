import type { AppContainer } from '@/modules/app/models/AppContainer';
import { AppConfigProvider } from '@/modules/app';
import { FetchHttpService } from '@/modules/core/services/impl/FetchHttpService';

export class ApplicationContainerProvider {
  private static instance: AppContainer | null = null;
  private static isInitialized = false;

  static initialize(): void {
    if (this.isInitialized) return;
    const config = AppConfigProvider.get();
    const apiService = new FetchHttpService();
    this.instance = { config, httpService: apiService };
    this.isInitialized = true;
  }

  static get(): AppContainer {
    if (!this.instance || !this.isInitialized) {
      throw new Error(
        'ApplicationContainer not initialized. Call ApplicationContainerProvider.initialize() after AppConfigProvider.initialize(config).'
      );
    }
    return this.instance;
  }

  static reset(): void {
    this.instance = null;
    this.isInitialized = false;
  }
}
