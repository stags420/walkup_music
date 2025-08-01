import { SpotifyApiService } from '@/modules/music/services/SpotifyApiService';
import { AuthService } from '@/modules/auth';

// Mock fetch globally
const mockFetch = jest.fn();
globalThis.fetch = mockFetch;

// Mock Response type for fetch
interface MockResponse {
  ok: boolean;
  status?: number;
  headers?: {
    get: jest.MockedFunction<(name: string) => string | null>;
  };
  json: jest.MockedFunction<() => Promise<unknown>>;
}

// Mock AuthService
const mockAuthService: jest.Mocked<AuthService> = {
  login: jest.fn(),
  logout: jest.fn(),
  getAccessToken: jest.fn(),
  isAuthenticated: jest.fn(),
  refreshToken: jest.fn(),
  handleCallback: jest.fn(),
  getUserInfo: jest.fn(),
};

describe('SpotifyApiService', () => {
  let spotifyApiService: SpotifyApiService;

  beforeEach(() => {
    jest.clearAllMocks();
    spotifyApiService = new SpotifyApiService(mockAuthService);
  });

  describe('searchTracks', () => {
    const mockSpotifyResponse = {
      tracks: {
        items: [
          {
            id: 'track1',
            name: 'Test Song',
            artists: [{ name: 'Test Artist' }],
            album: {
              name: 'Test Album',
              images: [
                {
                  url: 'https://example.com/image.jpg',
                  height: 300,
                  width: 300,
                },
              ],
            },
            preview_url: 'https://example.com/preview.mp3',
            duration_ms: 180000,
            uri: 'spotify:track:track1',
          },
        ],
        total: 1,
        limit: 20,
        offset: 0,
      },
    };

    test('should return empty array for empty query', async () => {
      // Given an empty query
      const query = '';

      // When searching for tracks
      const result = await spotifyApiService.searchTracks(query);

      // Then should return empty array without making API call
      expect(result).toEqual([]);
      expect(mockFetch).not.toHaveBeenCalled();
    });

    test('should return empty array for whitespace-only query', async () => {
      // Given a whitespace-only query
      const query = '   ';

      // When searching for tracks
      const result = await spotifyApiService.searchTracks(query);

      // Then should return empty array without making API call
      expect(result).toEqual([]);
      expect(mockFetch).not.toHaveBeenCalled();
    });

    test('should throw error when no access token available', async () => {
      // Given no access token is available
      mockAuthService.getAccessToken.mockResolvedValue(null);

      // When searching for tracks
      const searchPromise = spotifyApiService.searchTracks('test query');

      // Then should throw authentication error
      await expect(searchPromise).rejects.toThrow(
        'No valid access token available for Spotify API'
      );
    });

    test('should successfully search tracks with valid response', async () => {
      // Given a valid access token and successful API response
      mockAuthService.getAccessToken.mockResolvedValue('valid-token');
      mockFetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockSpotifyResponse),
      } as MockResponse);

      // When searching for tracks
      const result = await spotifyApiService.searchTracks('test query');

      // Then should return transformed tracks
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: 'track1',
        name: 'Test Song',
        artists: ['Test Artist'],
        album: 'Test Album',
        albumArt: 'https://example.com/image.jpg',
        previewUrl: 'https://example.com/preview.mp3',
        durationMs: 180000,
        uri: 'spotify:track:track1',
      });

      // And should make correct API call
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('https://api.spotify.com/v1/search'),
        {
          headers: {
            Authorization: 'Bearer valid-token',
            'Content-Type': 'application/json',
          },
        }
      );
    });

    test('should handle tracks without preview URLs', async () => {
      // Given a track without preview URL
      const responseWithoutPreview = {
        tracks: {
          items: [
            {
              ...mockSpotifyResponse.tracks.items[0],
              preview_url: null,
            },
          ],
          total: 1,
          limit: 20,
          offset: 0,
        },
      };

      mockAuthService.getAccessToken.mockResolvedValue('valid-token');
      mockFetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(responseWithoutPreview),
      } as MockResponse);

      // When searching for tracks
      const result = await spotifyApiService.searchTracks('test query');

      // Then should handle missing preview URL gracefully
      expect(result[0].previewUrl).toBe('');
    });

    test('should handle tracks without album art', async () => {
      // Given a track without album images
      const responseWithoutImages = {
        tracks: {
          items: [
            {
              ...mockSpotifyResponse.tracks.items[0],
              album: {
                name: 'Test Album',
                images: [],
              },
            },
          ],
          total: 1,
          limit: 20,
          offset: 0,
        },
      };

      mockAuthService.getAccessToken.mockResolvedValue('valid-token');
      mockFetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(responseWithoutImages),
      } as MockResponse);

      // When searching for tracks
      const result = await spotifyApiService.searchTracks('test query');

      // Then should handle missing album art gracefully
      expect(result[0].albumArt).toBe('');
    });

    test('should select best album art from multiple images', async () => {
      // Given multiple album art sizes
      const responseWithMultipleImages = {
        tracks: {
          items: [
            {
              ...mockSpotifyResponse.tracks.items[0],
              album: {
                name: 'Test Album',
                images: [
                  {
                    url: 'https://example.com/large.jpg',
                    height: 640,
                    width: 640,
                  },
                  {
                    url: 'https://example.com/medium.jpg',
                    height: 300,
                    width: 300,
                  },
                  {
                    url: 'https://example.com/small.jpg',
                    height: 64,
                    width: 64,
                  },
                ],
              },
            },
          ],
          total: 1,
          limit: 20,
          offset: 0,
        },
      };

      mockAuthService.getAccessToken.mockResolvedValue('valid-token');
      mockFetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(responseWithMultipleImages),
      } as MockResponse);

      // When searching for tracks
      const result = await spotifyApiService.searchTracks('test query');

      // Then should select medium-sized image (closest to 300px)
      expect(result[0].albumArt).toBe('https://example.com/medium.jpg');
    });

    test('should handle 401 authentication error', async () => {
      // Given an authentication error response
      mockAuthService.getAccessToken.mockResolvedValue('invalid-token');
      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
        json: jest.fn().mockResolvedValue({
          error: { message: 'Invalid access token' },
        }),
      } as MockResponse);

      // When searching for tracks
      const searchPromise = spotifyApiService.searchTracks('test query');

      // Then should throw authentication error
      await expect(searchPromise).rejects.toThrow(
        'Spotify authentication expired. Please log in again.'
      );
    });

    test('should handle 403 forbidden error', async () => {
      // Given a forbidden error response
      mockAuthService.getAccessToken.mockResolvedValue('valid-token');
      mockFetch.mockResolvedValue({
        ok: false,
        status: 403,
        json: jest.fn().mockResolvedValue({
          error: { message: 'Insufficient client scope' },
        }),
      } as MockResponse);

      // When searching for tracks
      const searchPromise = spotifyApiService.searchTracks('test query');

      // Then should throw forbidden error
      await expect(searchPromise).rejects.toThrow(
        'Access forbidden. Please check your Spotify Premium subscription.'
      );
    });

    test('should handle 429 rate limit error with retry', async () => {
      // Given a rate limit error followed by success
      mockAuthService.getAccessToken.mockResolvedValue('valid-token');
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 429,
          headers: {
            get: jest.fn().mockReturnValue('1'), // Retry-After: 1 second
          },
          json: jest.fn().mockResolvedValue({}),
        } as MockResponse)
        .mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValue(mockSpotifyResponse),
        } as MockResponse);

      // When searching for tracks
      const result = await spotifyApiService.searchTracks('test query');

      // Then should retry and succeed
      expect(result).toHaveLength(1);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    test('should handle 500 server error', async () => {
      // Given a server error response
      mockAuthService.getAccessToken.mockResolvedValue('valid-token');
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        json: jest.fn().mockResolvedValue({
          error: { message: 'Internal server error' },
        }),
      } as MockResponse);

      // When searching for tracks
      const searchPromise = spotifyApiService.searchTracks('test query');

      // Then should throw server error
      await expect(searchPromise).rejects.toThrow(
        'Spotify service is temporarily unavailable. Please try again later.'
      );
    });

    test('should handle network errors with retry', async () => {
      // Given network errors followed by success
      mockAuthService.getAccessToken.mockResolvedValue('valid-token');
      mockFetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValue(mockSpotifyResponse),
        } as MockResponse);

      // When searching for tracks
      const result = await spotifyApiService.searchTracks('test query');

      // Then should retry and succeed
      expect(result).toHaveLength(1);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    test('should respect custom limit parameter', async () => {
      // Given a custom limit
      mockAuthService.getAccessToken.mockResolvedValue('valid-token');
      mockFetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockSpotifyResponse),
      } as MockResponse);

      // When searching with custom limit
      await spotifyApiService.searchTracks('test query', 10);

      // Then should include limit in API call
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('limit=10'),
        expect.any(Object)
      );
    });

    test('should cap limit at 50 (Spotify API maximum)', async () => {
      // Given a limit exceeding Spotify's maximum
      mockAuthService.getAccessToken.mockResolvedValue('valid-token');
      mockFetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockSpotifyResponse),
      } as MockResponse);

      // When searching with excessive limit
      await spotifyApiService.searchTracks('test query', 100);

      // Then should cap at 50
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('limit=50'),
        expect.any(Object)
      );
    });

    test('should include market parameter in search', async () => {
      // Given a search request
      mockAuthService.getAccessToken.mockResolvedValue('valid-token');
      mockFetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockSpotifyResponse),
      } as MockResponse);

      // When searching for tracks
      await spotifyApiService.searchTracks('test query');

      // Then should include US market parameter
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('market=US'),
        expect.any(Object)
      );
    });

    test('should handle invalid search response structure', async () => {
      // Given an invalid response structure
      mockAuthService.getAccessToken.mockResolvedValue('valid-token');
      mockFetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({ invalid: 'response' }),
      } as MockResponse);

      // When searching for tracks
      const searchPromise = spotifyApiService.searchTracks('test query');

      // Then should throw validation error
      await expect(searchPromise).rejects.toThrow(
        'Invalid search response: missing tracks object'
      );
    });

    test('should handle multiple artists correctly', async () => {
      // Given a track with multiple artists
      const responseWithMultipleArtists = {
        tracks: {
          items: [
            {
              ...mockSpotifyResponse.tracks.items[0],
              artists: [
                { name: 'Artist 1' },
                { name: 'Artist 2' },
                { name: 'Artist 3' },
              ],
            },
          ],
          total: 1,
          limit: 20,
          offset: 0,
        },
      };

      mockAuthService.getAccessToken.mockResolvedValue('valid-token');
      mockFetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(responseWithMultipleArtists),
      } as MockResponse);

      // When searching for tracks
      const result = await spotifyApiService.searchTracks('test query');

      // Then should include all artists
      expect(result[0].artists).toEqual(['Artist 1', 'Artist 2', 'Artist 3']);
    });
  });

  describe('rate limiting', () => {
    beforeEach(() => {
      // Use a faster rate limit for testing
      spotifyApiService = new SpotifyApiService(mockAuthService, {
        maxRequestsPerSecond: 2,
        retryDelayMs: 100,
        maxRetries: 1,
      });
    });

    test('should enforce rate limiting between requests', async () => {
      // Given successful API responses
      mockAuthService.getAccessToken.mockResolvedValue('valid-token');
      mockFetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          tracks: { items: [], total: 0, limit: 20, offset: 0 },
        }),
      } as MockResponse);

      const startTime = Date.now();

      // When making multiple requests quickly
      await Promise.all([
        spotifyApiService.searchTracks('query1'),
        spotifyApiService.searchTracks('query2'),
        spotifyApiService.searchTracks('query3'),
      ]);

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Then should take at least 1 second (3 requests at 2 per second)
      expect(duration).toBeGreaterThan(500); // Allow some tolerance
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });
  });
});
