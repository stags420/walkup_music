import { appConfigProvider, AppConfig } from '@/modules/config';

describe('AppConfigProvider', () => {
  const mockConfig: AppConfig = {
    maxSegmentDuration: 15,
    spotifyClientId: 'test-client-id',
    redirectUri: 'http://test.example.com/callback',
    tokenRefreshBufferMinutes: 15,
  };

  beforeEach(() => {
    // Reset the provider before each test
    appConfigProvider.reset();
  });

  afterEach(() => {
    // Clean up after each test
    appConfigProvider.reset();
  });

  describe('initialize and get', () => {
    it('should initialize and return config successfully', () => {
      // Given I initialize the config
      appConfigProvider.initialize(mockConfig);

      // When I get the config
      const config = appConfigProvider.get();

      // Then I should receive the initialized config
      expect(config).toEqual(mockConfig);
    });

    it('should throw error when get() is called before initialize()', () => {
      // Given the config is not initialized
      // When I try to get the config
      // Then it should throw an error
      expect(() => appConfigProvider.get()).toThrow(
        'AppConfig has not been initialized. ' +
          'Call appConfigProvider.initialize(config) at application startup before using the config.'
      );
    });

    it('should warn and ignore re-initialization attempts', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      // Given I initialize the config
      appConfigProvider.initialize(mockConfig);

      // When I try to initialize again
      const newConfig: AppConfig = {
        ...mockConfig,
        maxSegmentDuration: 20,
      };
      appConfigProvider.initialize(newConfig);

      // Then it should warn and keep the original config
      expect(consoleSpy).toHaveBeenCalledWith(
        'AppConfig is already initialized. Skipping re-initialization.'
      );
      expect(appConfigProvider.get()).toEqual(mockConfig);

      consoleSpy.mockRestore();
    });
  });

  describe('isConfigInitialized', () => {
    it('should return false when not initialized', () => {
      expect(appConfigProvider.isConfigInitialized()).toBe(false);
    });

    it('should return true when initialized', () => {
      appConfigProvider.initialize(mockConfig);
      expect(appConfigProvider.isConfigInitialized()).toBe(true);
    });
  });

  describe('createForTesting', () => {
    it('should return the provided test config', () => {
      const testConfig = appConfigProvider.createForTesting(mockConfig);
      expect(testConfig).toEqual(mockConfig);
    });
  });

  describe('reset', () => {
    it('should reset initialization state', () => {
      // Given the config is initialized
      appConfigProvider.initialize(mockConfig);
      expect(appConfigProvider.isConfigInitialized()).toBe(true);

      // When I reset
      appConfigProvider.reset();

      // Then it should be uninitialized
      expect(appConfigProvider.isConfigInitialized()).toBe(false);
      expect(() => appConfigProvider.get()).toThrow();
    });
  });
});
