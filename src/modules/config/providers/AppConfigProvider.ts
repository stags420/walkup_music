// Singleton service provider for AppConfig following React concepts guidance
import { AppConfig } from '@/modules/config/models/AppConfig';

/**
 * Singleton service provider for AppConfig
 * This should be initialized once at app startup with the configuration
 *
 * Usage:
 *   // At startup:
 *   appConfigProvider.initialize(config);
 *
 *   // Anywhere else:
 *   const config = appConfigProvider.get();
 */
class AppConfigProvider {
  private instance: AppConfig | null = null;
  private isInitialized = false;

  /**
   * Initialize the app config at startup
   * This should be called once at the beginning of the application
   */
  initialize(config: AppConfig): void {
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
  get(): AppConfig {
    if (!this.instance || !this.isInitialized) {
      throw new Error(
        'AppConfig has not been initialized. ' +
          'Call appConfigProvider.initialize(config) at application startup before using the config.'
      );
    }

    return this.instance;
  }

  /**
   * Create a config instance for testing
   * @param testConfig - Test configuration
   */
  createForTesting(testConfig: AppConfig): AppConfig {
    return testConfig;
  }

  /**
   * Reset the singleton instance (useful for testing)
   */
  reset(): void {
    this.instance = null;
    this.isInitialized = false;
  }

  /**
   * Check if the config has been initialized
   */
  isConfigInitialized(): boolean {
    return this.isInitialized;
  }
}

// Export a singleton instance of the provider
const appConfigProvider = new AppConfigProvider();

export default appConfigProvider;
export { AppConfigProvider };
