import { AppConfig } from '@/modules/config/models/AppConfig';

/**
 * Provider for creating AppConfig instances with proper dependencies
 */
export class AppConfigProvider {
  private static instance: AppConfig | null = null;
  private static isInitialized = false;

  /**
   * Initialize the app config at startup
   * This should be called once at the beginning of the application
   */
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

  /**
   * Get the app config instance
   * @throws {Error} If config has not been initialized
   * @returns {AppConfig} The initialized configuration
   */
  static get(): AppConfig {
    if (!this.instance || !this.isInitialized) {
      throw new Error(
        'AppConfig has not been initialized. ' +
          'Call AppConfigProvider.initialize(config) at application startup before using the config.'
      );
    }

    return this.instance;
  }

  /**
   * Create a config instance for testing
   * @param testConfig - Test configuration
   */
  static createForTesting(testConfig: AppConfig): AppConfig {
    return testConfig;
  }

  /**
   * Reset the singleton instance (useful for testing)
   */
  static reset(): void {
    this.instance = null;
    this.isInitialized = false;
  }

  /**
   * Check if the config has been initialized
   */
  static isConfigInitialized(): boolean {
    return this.isInitialized;
  }
}
