import { AppConfigProvider, AppConfig } from '@/modules/config';

describe('AppConfigProvider', () => {
  const mockConfig: AppConfig = {
    maxSegmentDuration: 15,
    spotifyClientId: 'test-client-id',
    redirectUri: 'http://test.example.com/callback',
    tokenRefreshBufferMinutes: 15,
    basePath: '',
    mockAuth: false,
  };

  beforeEach(() => {
    // Reset the provider before each test
    AppConfigProvider.reset();
  });

  afterEach(() => {
    // Clean up after each test
    AppConfigProvider.reset();
  });

  describe('initialize and get', () => {
    it('should initialize and return config successfully', () => {
      // Given I initialize the config
      AppConfigProvider.initialize(mockConfig);

      // When I get the config
      const config = AppConfigProvider.get();

      // Then I should receive the initialized config
      expect(config).toEqual(mockConfig);
    });

    it('should throw error when get() is called before initialize()', () => {
      // Given the config is not initialized
      // When I try to get the config
      // Then it should throw an error
      expect(() => AppConfigProvider.get()).toThrow(
        'AppConfig has not been initialized. ' +
          'Call AppConfigProvider.initialize(config) at application startup before using the config.'
      );
    });

    it('should warn and ignore re-initialization attempts', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      // Given I initialize the config
      AppConfigProvider.initialize(mockConfig);

      // When I try to initialize again
      const newConfig: AppConfig = {
        ...mockConfig,
        maxSegmentDuration: 20,
      };
      AppConfigProvider.initialize(newConfig);

      // Then it should warn and keep the original config
      expect(consoleSpy).toHaveBeenCalledWith(
        'AppConfig is already initialized. Skipping re-initialization.'
      );
      expect(AppConfigProvider.get()).toEqual(mockConfig);

      consoleSpy.mockRestore();
    });
  });

  describe('isConfigInitialized', () => {
    it('should return false when not initialized', () => {
      expect(AppConfigProvider.isConfigInitialized()).toBe(false);
    });

    it('should return true when initialized', () => {
      AppConfigProvider.initialize(mockConfig);
      expect(AppConfigProvider.isConfigInitialized()).toBe(true);
    });
  });

  describe('createForTesting', () => {
    it('should return the provided test config', () => {
      const testConfig = AppConfigProvider.createForTesting(mockConfig);
      expect(testConfig).toEqual(mockConfig);
    });
  });

  describe('reset', () => {
    it('should reset initialization state', () => {
      // Given the config is initialized
      AppConfigProvider.initialize(mockConfig);
      expect(AppConfigProvider.isConfigInitialized()).toBe(true);

      // When I reset
      AppConfigProvider.reset();

      // Then it should be uninitialized
      expect(AppConfigProvider.isConfigInitialized()).toBe(false);
      expect(() => AppConfigProvider.get()).toThrow();
    });
  });
});
