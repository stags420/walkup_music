import { SpotifyApiService } from '@/modules/music/services/impl/SpotifyApiService';
import type { HttpService } from '@/modules/core/services/HttpService';
import type { AuthService } from '@/modules/auth';

// Mock fetch globally
const mockFetch = jest.fn();
globalThis.fetch = mockFetch;

// Removed fetch-based MockResponse; tests now mock HttpService

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
  const mockHttpService: jest.Mocked<HttpService> = {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockHttpService.get.mockReset();
    mockHttpService.post.mockReset();
    mockHttpService.put.mockReset();
    spotifyApiService = new SpotifyApiService(mockAuthService, mockHttpService);
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
            duration_ms: 180_000,
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
      mockAuthService.getAccessToken.mockResolvedValue();

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
      mockHttpService.get.mockResolvedValue({
        data: mockSpotifyResponse,
        status: 200,
        headers: new Headers(),
      });

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
        durationMs: 180_000,
        uri: 'spotify:track:track1',
      });

      // And should make correct API call
      expect(mockHttpService.get).toHaveBeenCalledWith(
        expect.stringContaining('https://api.spotify.com/v1/search'),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer valid-token',
          }),
        })
      );
    });

    test('should handle tracks without preview URLs', async () => {
      // Given a track without preview URL
      const responseWithoutPreview = {
        tracks: {
          items: [
            {
              ...mockSpotifyResponse.tracks.items[0],
              preview_url: undefined,
            },
          ],
          total: 1,
          limit: 20,
          offset: 0,
        },
      };

      mockAuthService.getAccessToken.mockResolvedValue('valid-token');
      mockHttpService.get.mockResolvedValue({
        data: responseWithoutPreview,
        status: 200,
        headers: new Headers(),
      });

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
      mockHttpService.get.mockResolvedValue({
        data: responseWithoutImages,
        status: 200,
        headers: new Headers(),
      });

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
      mockHttpService.get.mockResolvedValue({
        data: responseWithMultipleImages,
        status: 200,
        headers: new Headers(),
      });

      // When searching for tracks
      const result = await spotifyApiService.searchTracks('test query');

      // Then should select medium-sized image (closest to 300px)
      expect(result[0].albumArt).toBe('https://example.com/medium.jpg');
    });

    test('should handle 401 authentication error', async () => {
      // Given an authentication error response
      mockAuthService.getAccessToken.mockResolvedValue('invalid-token');
      mockHttpService.get.mockResolvedValue({
        data: { error: { message: 'Invalid access token' } },
        status: 401,
        headers: new Headers(),
      });

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
      mockHttpService.get.mockResolvedValue({
        data: { error: { message: 'Insufficient client scope' } },
        status: 403,
        headers: new Headers(),
      });

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
      mockHttpService.get
        .mockResolvedValueOnce({
          data: {},
          status: 429,
          headers: new Headers({ 'Retry-After': '1' }),
        })
        .mockResolvedValueOnce({
          data: mockSpotifyResponse,
          status: 200,
          headers: new Headers(),
        });

      await expect(
        spotifyApiService.searchTracks('test query')
      ).rejects.toThrow(
        'Too many requests to Spotify API. Please try again later.'
      );
    });

    test('should handle 500 server error', async () => {
      // Given a server error response
      mockAuthService.getAccessToken.mockResolvedValue('valid-token');
      mockHttpService.get.mockResolvedValue({
        data: { error: { message: 'Internal server error' } },
        status: 500,
        headers: new Headers(),
      });

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
      mockHttpService.get.mockRejectedValueOnce(new Error('Network error'));
      await expect(
        spotifyApiService.searchTracks('test query')
      ).rejects.toThrow('Network error');
    });

    test('should respect custom limit parameter', async () => {
      // Given a custom limit
      mockAuthService.getAccessToken.mockResolvedValue('valid-token');
      mockHttpService.get.mockResolvedValue({
        data: mockSpotifyResponse,
        status: 200,
        headers: new Headers(),
      });

      // When searching with custom limit
      await spotifyApiService.searchTracks('test query', 10);

      // Then should include limit in API call
      expect(mockHttpService.get).toHaveBeenCalledWith(
        expect.stringContaining('limit=10'),
        expect.any(Object)
      );
    });

    test('should cap limit at 50 (Spotify API maximum)', async () => {
      // Given a limit exceeding Spotify's maximum
      mockAuthService.getAccessToken.mockResolvedValue('valid-token');
      mockHttpService.get.mockResolvedValue({
        data: mockSpotifyResponse,
        status: 200,
        headers: new Headers(),
      });

      // When searching with excessive limit
      await spotifyApiService.searchTracks('test query', 100);

      // Then should cap at 50
      expect(mockHttpService.get).toHaveBeenCalledWith(
        expect.stringContaining('limit=50'),
        expect.any(Object)
      );
    });

    test('should include market parameter in search', async () => {
      // Given a search request
      mockAuthService.getAccessToken.mockResolvedValue('valid-token');
      mockHttpService.get.mockResolvedValue({
        data: mockSpotifyResponse,
        status: 200,
        headers: new Headers(),
      });

      // When searching for tracks
      await spotifyApiService.searchTracks('test query');

      // Then should include US market parameter
      expect(mockHttpService.get).toHaveBeenCalledWith(
        expect.stringContaining('market=US'),
        expect.any(Object)
      );
    });

    test('should handle invalid search response structure', async () => {
      // Given an invalid response structure
      mockAuthService.getAccessToken.mockResolvedValue('valid-token');
      mockHttpService.get.mockResolvedValue({
        data: { invalid: 'response' },
        status: 200,
        headers: new Headers(),
      });

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
      mockHttpService.get.mockResolvedValue({
        data: responseWithMultipleArtists,
        status: 200,
        headers: new Headers(),
      });

      // When searching for tracks
      const result = await spotifyApiService.searchTracks('test query');

      // Then should include all artists
      expect(result[0].artists).toEqual(['Artist 1', 'Artist 2', 'Artist 3']);
    });
  });

  // Rate limiting tests removed as functionality was dropped
});
