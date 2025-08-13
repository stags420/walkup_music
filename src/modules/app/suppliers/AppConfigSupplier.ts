import type { AppConfig } from '@/modules/app/models/AppConfig';

export class AppConfigSupplier {
  private static instance: AppConfig | undefined = undefined;
  private static isInitialized = false;

  static initialize(config: AppConfig): void {
    if (this.isInitialized) {
      console.warn(
        'AppConfig is already initialized. Skipping re-initialization.'
      );
      return;
    }
    this.instance = config;
    this.isInitialized = true;
  }

  static get(): AppConfig {
    if (!this.instance || !this.isInitialized) {
      throw new Error(
        'AppConfig has not been initialized. Call AppConfigProvider.initialize(config) at application startup before using the config.'
      );
    }
    return this.instance;
  }

  static createForTesting(testConfig: AppConfig): AppConfig {
    return testConfig;
  }

  static reset(): void {
    this.instance = undefined;
    this.isInitialized = false;
  }

  static isConfigInitialized(): boolean {
    return this.isInitialized;
  }
}
