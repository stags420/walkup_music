import { AppConfig } from '@/modules/app/models/AppConfig';
import { AuthServiceProvider } from '@/modules/auth/providers/AuthServiceProvider';
import { MusicServiceProvider } from '@/modules/music/providers/MusicServiceProvider';
import { MockAuthService } from '@/modules/auth/services/impl/MockAuthService';
import { MockMusicService } from '@/modules/music/services/MusicService';
import { AppConfigProvider } from '@/modules/app';

// Mock the global config provider
jest.mock('@/modules/app', () => ({
  AppConfigProvider: {
    get: jest.fn(),
    initialize: jest.fn(),
  },
}));

describe('Mock Mode Initialization', () => {
  beforeEach(() => {
    // Reset all providers before each test
    AuthServiceProvider.reset();
    MusicServiceProvider.reset();
    jest.clearAllMocks();
  });

  describe('AppConfig with mockAuth flag', () => {
    test('should accept mockAuth flag as true', () => {
      // Given config data with mockAuth enabled
      const configData = {
        maxSegmentDuration: 10,
        spotifyClientId: 'test-client-id',
        redirectUri: 'http://127.0.0.1:8000/callback',
        tokenRefreshBufferMinutes: 15,
        basePath: '',
        mockAuth: true,
      };

      // When creating AppConfig from external data
      const config = AppConfig.fromExternalData(configData);

      // Then mockAuth should be true
      expect(config.mockAuth).toBe(true);
    });

    test('should accept mockAuth flag as false', () => {
      // Given config data with mockAuth disabled
      const configData = {
        maxSegmentDuration: 10,
        spotifyClientId: 'test-client-id',
        redirectUri: 'http://127.0.0.1:8000/callback',
        tokenRefreshBufferMinutes: 15,
        basePath: '',
        mockAuth: false,
      };

      // When creating AppConfig from external data
      const config = AppConfig.fromExternalData(configData);

      // Then mockAuth should be false
      expect(config.mockAuth).toBe(false);
    });

    test('should default mockAuth to false when not provided', () => {
      // Given config data without mockAuth
      const configData = {
        maxSegmentDuration: 10,
        spotifyClientId: 'test-client-id',
        redirectUri: 'http://127.0.0.1:8000/callback',
        tokenRefreshBufferMinutes: 15,
        basePath: '',
      };

      // When creating AppConfig from external data
      const config = AppConfig.fromExternalData(configData);

      // Then mockAuth should default to false
      expect(config.mockAuth).toBe(false);
    });

    test('should throw error for invalid mockAuth type', () => {
      // Given config data with invalid mockAuth type
      const configData = {
        maxSegmentDuration: 10,
        spotifyClientId: 'test-client-id',
        redirectUri: 'http://127.0.0.1:8000/callback',
        tokenRefreshBufferMinutes: 15,
        basePath: '',
        mockAuth: 'invalid', // Should be boolean
      };

      // When creating AppConfig from external data
      // Then it should throw an error
      expect(() => AppConfig.fromExternalData(configData)).toThrow(
        'Invalid app config data: mockAuth must be a boolean'
      );
    });
  });

  describe('AuthServiceProvider with mock mode', () => {
    test('should create MockAuthService when mockAuth is true', () => {
      // Given config with mockAuth enabled
      const mockConfig = {
        maxSegmentDuration: 10,
        spotifyClientId: 'test-client-id',
        redirectUri: 'http://127.0.0.1:8000/callback',
        tokenRefreshBufferMinutes: 15,
        basePath: '',
        mockAuth: true,
      };
      (AppConfigProvider.get as jest.Mock).mockReturnValue(mockConfig);

      // When getting auth service
      const authService = AuthServiceProvider.getOrCreate();

      // Then it should be a MockAuthService
      expect(authService).toBeInstanceOf(MockAuthService);
    });

    test('should create SpotifyAuthService when mockAuth is false', () => {
      // Given config with mockAuth disabled
      const mockConfig = {
        maxSegmentDuration: 10,
        spotifyClientId: 'test-client-id',
        redirectUri: 'http://127.0.0.1:8000/callback',
        tokenRefreshBufferMinutes: 15,
        basePath: '',
        mockAuth: false,
      };
      (AppConfigProvider.get as jest.Mock).mockReturnValue(mockConfig);

      // When getting auth service
      const authService = AuthServiceProvider.getOrCreate();

      // Then it should not be a MockAuthService
      expect(authService).not.toBeInstanceOf(MockAuthService);
      // Note: We can't easily test for SpotifyAuthService without more complex mocking
    });
  });

  describe('MusicServiceProvider with mock mode', () => {
    test('should create MockMusicService when mockAuth is true', () => {
      // Given config with mockAuth enabled
      const mockConfig = {
        maxSegmentDuration: 10,
        spotifyClientId: 'test-client-id',
        redirectUri: 'http://127.0.0.1:8000/callback',
        tokenRefreshBufferMinutes: 15,
        basePath: '',
        mockAuth: true,
      };
      (AppConfigProvider.get as jest.Mock).mockReturnValue(mockConfig);

      // When getting music service
      const musicService = MusicServiceProvider.getOrCreate();

      // Then it should be a MockMusicService
      expect(musicService).toBeInstanceOf(MockMusicService);
    });

    test('should create MockMusicService when no auth service provided', () => {
      // Given config with mockAuth disabled but no auth service
      const mockConfig = {
        maxSegmentDuration: 10,
        spotifyClientId: 'test-client-id',
        redirectUri: 'http://127.0.0.1:8000/callback',
        tokenRefreshBufferMinutes: 15,
        basePath: '',
        mockAuth: false,
      };
      (AppConfigProvider.get as jest.Mock).mockReturnValue(mockConfig);

      // When getting music service without auth service
      const musicService = MusicServiceProvider.getOrCreate();

      // Then it should still be a MockMusicService (fallback behavior)
      expect(musicService).toBeInstanceOf(MockMusicService);
    });

    test('should override useMockService parameter when mockAuth is true', () => {
      // Given config with mockAuth enabled
      const mockConfig = {
        maxSegmentDuration: 10,
        spotifyClientId: 'test-client-id',
        redirectUri: 'http://127.0.0.1:8000/callback',
        tokenRefreshBufferMinutes: 15,
        basePath: '',
        mockAuth: true,
      };
      (AppConfigProvider.get as jest.Mock).mockReturnValue(mockConfig);

      // Create a mock auth service
      const mockAuthService = new MockAuthService();

      // When getting music service with useMockService=false but mockAuth=true
      const musicService = MusicServiceProvider.getOrCreate(
        mockAuthService,
        false
      );

      // Then it should still be a MockMusicService (config overrides parameter)
      expect(musicService).toBeInstanceOf(MockMusicService);
    });
  });

  describe('integration behavior', () => {
    test('should work completely offline in mock mode', async () => {
      // Given mock auth service
      const mockAuthService = new MockAuthService();

      // When performing auth operations
      await mockAuthService.login();
      const token = await mockAuthService.getAccessToken();
      const userInfo = await mockAuthService.getUserInfo();

      // Then all operations should succeed without network calls
      expect(mockAuthService.isAuthenticated()).toBe(true);
      expect(token).toBe('mock-access-token-12345');
      expect(userInfo).toEqual({
        id: 'mock-user-123',
        email: 'mock@example.com',
        displayName: 'Mock User',
      });
    });

    test('should provide consistent mock data across service calls', async () => {
      // Given mock auth service
      const mockAuthService = new MockAuthService();
      await mockAuthService.login();

      // When getting user info multiple times
      const userInfo1 = await mockAuthService.getUserInfo();
      const userInfo2 = await mockAuthService.getUserInfo();

      // Then data should be consistent
      expect(userInfo1).toEqual(userInfo2);
      expect(userInfo1?.id).toBe('mock-user-123');
    });
  });
});
